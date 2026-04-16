'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { verifyPayment } from '@/lib/services';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, Mail, QrCode, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { QRCodeTicket } from '@/components/ticket/QRCodeTicket';
import { Registration } from '@/lib/api';

// Addon type for registration
interface RegistrationAddon {
    id: number;
    name: string;
    price: string;
}

function SuccessContent() {
    const searchParams = useSearchParams();
    const paymentIntent = searchParams.get('payment_intent');
    const sessionId = searchParams.get('session_id');
    const regCode = searchParams.get('code');
    const [status, setStatus] = useState<'loading' | 'paid' | 'unpaid' | 'error' | 'processing'>('loading');
    const [registrationId, setRegistrationId] = useState<string>('');
    const [registration, setRegistration] = useState<Registration | null>(null);

    useEffect(() => {
        async function verify() {
            let regId = '';
            // If we have a regCode (free ticket), show success immediately
            if (regCode && !sessionId && !paymentIntent) {
                setStatus('paid');
                regId = regCode;
            } else {
                // Verify payment if we have an ID
                const idToVerify = sessionId || paymentIntent;

                if (!idToVerify) {
                    setStatus('error');
                    return;
                }

                try {
                    const result = await verifyPayment(idToVerify);
                    if (result.status === 'paid') {
                        setStatus('paid');
                        regId = result.registrationId?.toString() || regCode || '';
                    } else if (result.status === 'processing') {
                        setStatus('processing');
                    } else {
                        setStatus('unpaid');
                    }
                } catch {
                    setStatus('error');
                }
            }

            if ((status === 'paid' || regId) && regId) {
                setRegistrationId(regId);
                try {
                    // Mock registration details
                    await new Promise(resolve => setTimeout(resolve, 300));
                    setRegistration({
                        id: parseInt(regId) || Date.now(),
                        regCode: regId,
                        eventId: 1,
                        ticketTypeId: 1,
                        attendeeType: 'public',
                        firstName: 'ผู้ใช้',
                        lastName: 'ทดสอบ',
                        email: 'test@example.com',
                        phone: null,
                        organization: null,
                        status: 'confirmed',
                        qrCode: `QR-${regId}`,
                        checkInTime: null,
                    });
                } catch {
                    // Silent fail - registration details are optional
                }
            }
        }
        verify();
    }, [sessionId, paymentIntent, regCode, status]);

    if (status === 'loading') {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-[#8a8a00] mb-4" />
                <h2 className="text-xl font-bold">กำลังตรวจสอบการชำระเงิน...</h2>
            </div>
        );
    }

    if (status === 'processing') {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mb-6">
                    <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
                </div>
                <h2 className="text-2xl font-bold mb-4">กำลังดำเนินการชำระเงิน</h2>
                <p className="text-gray-400 mb-8 max-w-lg">
                    เราได้รับข้อมูลการชำระเงินแล้ว ธนาคารกำลังตรวจสอบยอดเงิน<br />
                    กรุณารอสักครู่ หรือกลับมาตรวจสอบสถานะภายหลัง
                </p>
                <div className="flex gap-4">
                    <Link href="/events"><Button variant="outline">กลับไปหน้างาน</Button></Link>
                    <Button onClick={() => window.location.reload()}>ตรวจสอบอีกครั้ง</Button>
                </div>
            </div>
        );
    }

    if (status === 'error' || status === 'unpaid') {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold mb-4">ไม่สามารถยืนยันการชำระเงินได้</h2>
                <p className="text-gray-400 mb-8">กรุณาตรวจสอบอีเมลหรือติดต่อทีมงาน</p>
                <div className="flex gap-4">
                    <Link href="/events"><Button variant="outline">กลับไปหน้างาน</Button></Link>
                    <Link href="/contact"><Button>ติดต่อทีมงาน</Button></Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-[#8a8a00]/20 blur-3xl rounded-full animate-pulse" />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#8a8a00] to-[#737300] flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-white" />
                </div>
            </div>
            <div className="inline-block px-4 py-1 bg-[#8a8a00]/20 text-[#8a8a00] rounded-full text-sm mb-4">ชำระเงินสำเร็จ</div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">ลงทะเบียนเรียบร้อยแล้ว!</h1>
            <p className="text-gray-400 mb-8 max-w-lg">เราได้ส่งรายละเอียดพร้อม QR Code ไปยังอีเมลของคุณแล้ว</p>

            <div className="grid sm:grid-cols-2 gap-4 max-w-md mb-8">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-[#8a8a00]/20 flex items-center justify-center"><Mail className="w-5 h-5 text-[#8a8a00]" /></div>
                        <div className="text-sm font-medium">ตรวจสอบอีเมล</div>
                    </div>
                    <p className="text-xs text-gray-400">อีเมลยืนยันถูกส่งแล้ว</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-[#8a8a00]/20 flex items-center justify-center"><QrCode className="w-5 h-5 text-[#8a8a00]" /></div>
                        <div className="text-sm font-medium">QR Code</div>
                    </div>
                    <p className="text-xs text-gray-400">ใช้ Check-in วันงาน</p>
                </div>
            </div>

            {/* Add-on details */}
            {registration?.addons && registration.addons.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 w-full max-w-md mb-8">
                    <h3 className="text-left font-bold mb-3 border-b border-white/10 pb-2">รายการเพิ่มเติม (Add-ons)</h3>
                    <div className="space-y-2">
                        {registration.addons.map((addon: RegistrationAddon) => (
                            <div key={addon.id} className="flex justify-between text-sm">
                                <span className="text-gray-300">{addon.name}</span>
                                <span className="text-[#8a8a00]">฿{parseFloat(addon.price).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* QR Code Section */}
            {registrationId && (
                <div className="mb-8">
                    <QRCodeTicket
                        regCode={registrationId}
                        size={180}
                        showDownload={true}
                    />
                </div>
            )}

            <div className="flex gap-4">
                <Link href="/"><Button variant="outline">กลับหน้าหลัก</Button></Link>
                <Link href="/events"><Button className="bg-gradient-to-r from-[#8a8a00] to-[#737300]">ดูงานอื่นๆ</Button></Link>
            </div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            <Navbar />
            <main className="pt-24 pb-12 px-4 sm:px-6">
                <div className="container mx-auto max-w-4xl">
                    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#8a8a00]" /></div>}>
                        <SuccessContent />
                    </Suspense>
                </div>
            </main>
            <Footer />
        </div>
    );
}
