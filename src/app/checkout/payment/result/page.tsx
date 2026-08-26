'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { paymentsApi } from '@/lib/api/payments';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Loader2, CheckCircle, XCircle, Clock, AlertCircle, Mail, QrCode } from 'lucide-react';
import Link from 'next/link';
import { QRCodeTicket } from '@/components/ticket/QRCodeTicket';

type PaymentStatus = 'polling' | 'paid' | 'pending' | 'failed' | 'cancelled' | 'error';

const MAX_POLL_ATTEMPTS = 20;
const POLL_INTERVAL_MS = 3000;

function readCheckoutRedirectContext() {
    if (typeof window === 'undefined') {
        return { originApp: null as string | null, returnTo: null as string | null, websiteUrl: null as string | null };
    }

    try {
        const raw = sessionStorage.getItem('checkout-payment-data');
        if (!raw) {
            return { originApp: null, returnTo: null, websiteUrl: null };
        }

        const parsed = JSON.parse(raw) as { originApp?: string; returnTo?: string; websiteUrl?: string };
        return {
            originApp: parsed.originApp || null,
            returnTo: parsed.returnTo || null,
            websiteUrl: parsed.websiteUrl || null,
        };
    } catch {
        return { originApp: null, returnTo: null, websiteUrl: null };
    }
}

function buildExternalReturnUrl(returnTo: string | null, params: Record<string, string | null | undefined>) {
    if (!returnTo) return null;

    try {
        const url = new URL(returnTo, typeof window !== 'undefined' ? window.location.origin : undefined);

        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return null;
        }

        for (const [key, value] of Object.entries(params)) {
            if (value) {
                url.searchParams.set(key, value);
            }
        }

        return url.toString();
    } catch {
        return null;
    }
}

function PaymentResultInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isLoggedIn, isLoading: authLoading } = useAuth();

    const [status, setStatus] = useState<PaymentStatus>('polling');
    const [regCode, setRegCode] = useState<string | null>(null);
    const [orderNumber, setOrderNumber] = useState<string | null>(null);
    const [amount, setAmount] = useState<string | null>(null);
    const [currency, setCurrency] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [isReturning, setIsReturning] = useState(false);
    const [countdown, setCountdown] = useState(10);
    const countdownTimer = useRef<NodeJS.Timeout | null>(null);
    const pollCount = useRef(0);
    const pollTimer = useRef<NodeJS.Timeout | null>(null);
    const redirectTimer = useRef<NodeJS.Timeout | null>(null);

    const refnoFromUrl = searchParams.get('refno') || searchParams.get('Refno');
    const orderRefFromUrl = searchParams.get('orderRef') || searchParams.get('Ref');
    const isFreeRegistration = searchParams.get('free') === '1';
    const [redirectContext] = useState(() => {
        const stored = readCheckoutRedirectContext();
        return {
            originApp: searchParams.get('originApp') || stored.originApp,
            returnTo: searchParams.get('returnTo') || stored.returnTo,
            websiteUrl: stored.websiteUrl,
        };
    });
    // Capture payment identity ONCE on mount. clearPaymentSession() wipes these
    // sessionStorage keys on success; reading them on every render would make
    // paymentRef flip to null after success and re-trigger the "not found" error.
    const [paymentIdentity] = useState(() => {
        const ss = typeof window !== 'undefined' ? window.sessionStorage : null;
        const refnoVal = refnoFromUrl || ss?.getItem('payment-refno') || null;
        const orderRefVal = orderRefFromUrl || ss?.getItem('payment-orderRef') || null;
        const storedGateway = ss?.getItem('payment-gateway') || null;
        const gatewayVal = (searchParams.get('gateway')
            || (orderRefFromUrl && !refnoFromUrl ? 'ktb' : storedGateway)
            || 'paysolutions') as 'paysolutions' | 'ktb';
        return {
            refno: refnoVal,
            orderRef: orderRefVal,
            gateway: gatewayVal,
            paymentRef: gatewayVal === 'ktb' ? orderRefVal : refnoVal,
            eventId: ss?.getItem('payment-event-id') || null,
        };
    });
    const { refno, orderRef, gateway, paymentRef, eventId } = paymentIdentity;
    const originApp = redirectContext.originApp
        || (typeof window !== 'undefined' ? sessionStorage.getItem('sso-origin-app') : null);
    const returnTo = redirectContext.returnTo;
    const storedWebsiteUrl = redirectContext.websiteUrl;
    // Determine "back to website" URL: prefer websiteUrl from DB, fallback to returnTo
    const backToWebsiteUrl = storedWebsiteUrl || returnTo || null;
    const isSsoUser = !!originApp;

    const clearPaymentSession = useCallback(() => {
        sessionStorage.removeItem('checkout-payment-data');
        sessionStorage.removeItem('payment-refno');
        sessionStorage.removeItem('payment-orderRef');
        sessionStorage.removeItem('payment-gateway');
        sessionStorage.removeItem('payment-event-id');
        if (eventId) {
            sessionStorage.removeItem(`checkout-wizard-${eventId}`);
        }
    }, [eventId]);

    const pollVerify = useCallback(async () => {
        if (!paymentRef) {
            setErrorMessage('ไม่พบข้อมูลการชำระเงิน');
            setStatus('error');
            return;
        }

        try {
            const result = await paymentsApi.verify(
                gateway === 'ktb'
                    ? { gateway: 'ktb', orderRef: paymentRef }
                    : { refno: paymentRef }
            );

            if (result.success) {
                switch (result.status) {
                    case 'paid':
                        setStatus('paid');
                        setRegCode(result.regCode || null);
                        setOrderNumber(result.orderNumber || null);
                        setAmount(result.amount || null);
                        setCurrency(result.currency || null);
                        // Cleanup sessionStorage
                        clearPaymentSession();
                        return;
                    case 'failed':
                        setStatus('failed');
                        return;
                    case 'cancelled':
                        setStatus('cancelled');
                        return;
                    case 'pending':
                        // Continue polling
                        break;
                }
            }

            pollCount.current++;
            if (pollCount.current >= MAX_POLL_ATTEMPTS) {
                setStatus('pending');
                return;
            }

            pollTimer.current = setTimeout(pollVerify, POLL_INTERVAL_MS);
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาด';
            // If 404 or network error, keep polling a few more times
            if (pollCount.current < 5) {
                pollCount.current++;
                pollTimer.current = setTimeout(pollVerify, POLL_INTERVAL_MS);
                return;
            }
            setErrorMessage(msg);
            setStatus('error');
        }
    }, [clearPaymentSession, gateway, paymentRef]);

    useEffect(() => {
        if (authLoading) return;

        // Free registration — show success immediately without polling
        if (isFreeRegistration) {
            setOrderNumber(searchParams.get('orderNumber') || null);
            setRegCode(searchParams.get('regCode') || null);
            setAmount('0');
            setCurrency('THB');
            setStatus('paid');
            clearPaymentSession();
            return;
        }

        if (!paymentRef) {
            setErrorMessage('ไม่พบข้อมูลการชำระเงิน กรุณาเริ่มต้นใหม่');
            setStatus('error');
            return;
        }

        pollVerify();

        return () => {
            if (pollTimer.current) {
                clearTimeout(pollTimer.current);
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, clearPaymentSession, isFreeRegistration, paymentRef, pollVerify, searchParams]);

    // SSO auto-redirect countdown: 10s after payment success
    useEffect(() => {
        if (status !== 'paid' || !isSsoUser || !backToWebsiteUrl) {
            setIsReturning(false);
            return;
        }

        setIsReturning(true);

        countdownTimer.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    if (countdownTimer.current) clearInterval(countdownTimer.current);
                    const targetUrl = buildExternalReturnUrl(backToWebsiteUrl, {
                        status: 'registered',
                        regCode,
                        orderNumber,
                    });
                    window.location.assign(targetUrl || backToWebsiteUrl);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (countdownTimer.current) clearInterval(countdownTimer.current);
            if (redirectTimer.current) clearTimeout(redirectTimer.current);
        };
    }, [status, isSsoUser, backToWebsiteUrl, regCode, orderNumber]);

    const renderContent = () => {
        switch (status) {
            case 'polling':
                return (
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 mx-auto bg-[#8a8a00]/10 rounded-full flex items-center justify-center">
                            <Loader2 className="w-10 h-10 animate-spin text-[#8a8a00]" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">กำลังตรวจสอบการชำระเงิน</h2>
                        <p className="text-gray-500 text-sm">กรุณารอสักครู่ ระบบกำลังตรวจสอบสถานะ...</p>
                        <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>ตรวจสอบครั้งที่ {pollCount.current + 1}/{MAX_POLL_ATTEMPTS}</span>
                        </div>
                    </div>
                );

            case 'paid':
                return (
                    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-[#8a8a00]/20 blur-3xl rounded-full animate-pulse" />
                            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#8a8a00] to-[#737300] flex items-center justify-center shadow-[0_0_40px_rgba(138,138,0,0.28)]">
                                <CheckCircle className="w-12 h-12 text-white" />
                            </div>
                        </div>

                        <div className="inline-block px-4 py-1 bg-[#8a8a00]/20 text-[#8a8a00] rounded-full text-sm mb-4">
                            {isFreeRegistration ? 'ลงทะเบียนสำเร็จ' : 'ชำระเงินสำเร็จ'}
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold mb-4">ลงทะเบียนเรียบร้อยแล้ว!</h1>
                        <p className="text-gray-400 mb-8 max-w-lg">
                            เราได้ส่งรายละเอียดพร้อม QR Code ไปยังอีเมลของคุณแล้ว
                        </p>

                        <div className="ui-form-grid max-w-md mb-8 w-full">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-lg bg-[#8a8a00]/20 flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-[#8a8a00]" />
                                    </div>
                                    <div className="text-sm font-medium">ตรวจสอบอีเมล</div>
                                </div>
                                <p className="text-xs text-gray-400">อีเมลยืนยันและใบเสร็จถูกส่งแล้ว</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-lg bg-[#8a8a00]/20 flex items-center justify-center">
                                        <QrCode className="w-5 h-5 text-[#8a8a00]" />
                                    </div>
                                    <div className="text-sm font-medium">QR Code</div>
                                </div>
                                <p className="text-xs text-gray-400">ใช้สำหรับ Check-in ในวันงาน</p>
                            </div>
                        </div>

                        {(orderNumber || amount) && (
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 text-sm w-full max-w-md mb-8">
                                {orderNumber && (
                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-400">เลขที่คำสั่งซื้อ</span>
                                        <span className="font-mono text-right">{orderNumber}</span>
                                    </div>
                                )}
                                {amount && (
                                    <div className="flex justify-between gap-4">
                                        <span className="text-gray-400">ยอดชำระ</span>
                                        <span className="font-bold text-[#8a8a00]">
                                            {currency === 'USD' ? '$' : '฿'}{Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {regCode && (
                            <div className="mb-8">
                                <QRCodeTicket
                                    regCode={regCode}
                                    size={180}
                                    showDownload={true}
                                />
                            </div>
                        )}

                        {isReturning && countdown > 0 && (
                            <div className="text-sm text-gray-400 mb-6">
                                กลับไปหน้าเว็บไซต์อัตโนมัติใน <span className="font-bold text-[#8a8a00]">{countdown}</span> วินาที
                            </div>
                        )}

                        <div className="ui-responsive-actions">
                            {backToWebsiteUrl ? (
                                <a
                                    href={backToWebsiteUrl}
                                    className="px-5 py-2.5 border border-white/20 text-foreground font-medium rounded-lg hover:bg-white/10 transition-colors text-sm"
                                >
                                    กลับไปหน้าเว็บไซต์
                                </a>
                            ) : (
                                <Link
                                    href="/my-tickets"
                                    className="px-5 py-2.5 border border-white/20 text-foreground font-medium rounded-lg hover:bg-white/10 transition-colors text-sm"
                                >
                                    ดูตั๋วของฉัน
                                </Link>
                            )}
                            <Link
                                href="/events"
                                className="px-5 py-2.5 bg-gradient-to-r from-[#8a8a00] to-[#737300] text-white font-medium rounded-lg hover:from-[#737300] hover:to-[#686805] transition-colors text-sm"
                            >
                                ดูงานอื่นๆ
                            </Link>
                        </div>
                    </div>
                );

            case 'pending':
                return (
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 mx-auto bg-amber-50 rounded-full flex items-center justify-center">
                            <Clock className="w-10 h-10 text-amber-500" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">รอการยืนยัน</h2>
                        <p className="text-gray-500 text-sm">
                            ระบบยังไม่ได้รับการยืนยันจากธนาคาร<br />
                            กรุณาตรวจสอบสถานะอีกครั้งในภายหลัง
                        </p>
                        <div className="ui-responsive-actions pt-2">
                            <button
                                onClick={() => {
                                    pollCount.current = 0;
                                    setStatus('polling');
                                    pollVerify();
                                }}
                                className="px-5 py-2.5 bg-[#8a8a00] text-white font-medium rounded-lg hover:bg-[#456339] transition-colors text-sm"
                            >
                                ตรวจสอบอีกครั้ง
                            </button>
                            <Link
                                href="/events"
                                className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                            >
                                กลับหน้าหลัก
                            </Link>
                        </div>
                    </div>
                );

            case 'failed':
                return (
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 mx-auto bg-red-50 rounded-full flex items-center justify-center">
                            <XCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">การชำระเงินไม่สำเร็จ</h2>
                        <p className="text-gray-500 text-sm">กรุณาลองใหม่อีกครั้ง หรือเลือกวิธีชำระเงินอื่น</p>
                        <div className="ui-responsive-actions pt-2">
                            {eventId && (
                                <Link
                                    href={`/checkout/${eventId}`}
                                    className="px-5 py-2.5 bg-[#8a8a00] text-white font-medium rounded-lg hover:bg-[#456339] transition-colors text-sm"
                                >
                                    ลองชำระเงินอีกครั้ง
                                </Link>
                            )}
                            <Link
                                href="/events"
                                className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                            >
                                กลับหน้าหลัก
                            </Link>
                        </div>
                    </div>
                );

            case 'cancelled':
                return (
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                            <XCircle className="w-10 h-10 text-gray-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">ยกเลิกการชำระเงิน</h2>
                        <p className="text-gray-500 text-sm">คุณได้ยกเลิกการชำระเงิน</p>
                        <div className="ui-responsive-actions pt-2">
                            {eventId && (
                                <Link
                                    href={`/checkout/${eventId}`}
                                    className="px-5 py-2.5 bg-[#8a8a00] text-white font-medium rounded-lg hover:bg-[#456339] transition-colors text-sm"
                                >
                                    กลับไปชำระเงิน
                                </Link>
                            )}
                            <Link
                                href="/events"
                                className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                            >
                                กลับหน้าหลัก
                            </Link>
                        </div>
                    </div>
                );

            case 'error':
                return (
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 mx-auto bg-red-50 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-10 h-10 text-red-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-700">เกิดข้อผิดพลาด</h2>
                        <p className="text-gray-500 text-sm">{errorMessage}</p>
                        <div className="ui-responsive-actions pt-2">
                            <button
                                onClick={() => router.back()}
                                className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                            >
                                ย้อนกลับ
                            </button>
                            <Link
                                href="/events"
                                className="px-5 py-2.5 bg-[#8a8a00] text-white font-medium rounded-lg hover:bg-[#456339] transition-colors text-sm"
                            >
                                กลับหน้าหลัก
                            </Link>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className={status === 'paid'
            ? 'min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden'
            : 'min-h-screen bg-white flex flex-col'}>
            <Navbar />
            <main className={status === 'paid' ? 'ui-page-main-tight flex-1' : 'ui-centered-page'}>
                <div className={status === 'paid' ? 'ui-shell max-w-4xl w-full' : 'max-w-lg w-full'}>
                    {renderContent()}
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default function PaymentResultPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-white flex flex-col">
                    <Navbar />
                    <div className="ui-centered-page">
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 mx-auto bg-[#8a8a00]/10 rounded-full flex items-center justify-center">
                                <Loader2 className="w-10 h-10 animate-spin text-[#8a8a00]" />
                            </div>
                            <p className="text-gray-500 text-sm">กำลังโหลด...</p>
                        </div>
                    </div>
                    <Footer />
                </div>
            }
        >
            <PaymentResultInner />
        </Suspense>
    );
}
