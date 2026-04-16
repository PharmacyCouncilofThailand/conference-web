'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { paymentsApi } from '@/lib/api/payments';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

interface CheckoutPaymentData {
    eventId: string;
    originApp?: string;
    returnTo?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    country: string;
    selectedPackage: string;
    selectedAddOns: string[];
    isAddonOnly?: boolean;
    dietaryRequirement: string;
    dietaryOtherText: string;
    selectedWorkshopTopic?: string;
    promoCode: string;
    promoApplied: boolean;
    currency: 'THB' | 'USD';
    paymentMethod: 'qr' | 'card';
    needTaxInvoice: boolean;
    taxName: string;
    taxId: string;
    taxAddress: string;
    taxSubDistrict: string;
    taxDistrict: string;
    taxProvince: string;
    taxPostalCode: string;
}

export default function PaymentPage() {
    const router = useRouter();
    const { isLoggedIn, isLoading: authLoading } = useAuth();
    const formRef = useRef<HTMLFormElement>(null);
    const [status, setStatus] = useState<'loading' | 'submitting' | 'error'>('loading');
    const [, setGateway] = useState<'paysolutions' | 'ktb' | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [formData, setFormData] = useState<{ actionUrl: string; fields: Record<string, string> } | null>(null);
    const hasSubmitted = useRef(false);

    useEffect(() => {
        if (authLoading) return;
        if (!isLoggedIn) {
            router.push('/login');
            return;
        }

        const createPaymentIntent = async () => {
            try {
                const saved = sessionStorage.getItem('checkout-payment-data');
                if (!saved) {
                    setErrorMessage('ไม่พบข้อมูล checkout กรุณาเริ่มต้นใหม่');
                    setStatus('error');
                    return;
                }

                const data: CheckoutPaymentData = JSON.parse(saved);
                const parsedEventId = Number(data.eventId);
                const workshopSessionId = data.selectedWorkshopTopic
                    ? Number(data.selectedWorkshopTopic)
                    : undefined;

                // Build create-intent request body
                const requestBody = {
                    eventId: parsedEventId,
                    packageId: data.isAddonOnly ? '' : data.selectedPackage,
                    addOnIds: data.selectedAddOns,
                    currency: data.currency || 'THB',
                    paymentMethod: data.paymentMethod,
                    promoCode: data.promoApplied ? data.promoCode : undefined,
                    workshopSessionId: Number.isFinite(workshopSessionId) ? workshopSessionId : undefined,
                    dietaryRequirement: data.dietaryRequirement === 'other'
                        ? data.dietaryOtherText
                        : data.dietaryRequirement || undefined,
                    needTaxInvoice: data.needTaxInvoice,
                    taxName: data.needTaxInvoice ? data.taxName : undefined,
                    taxId: data.needTaxInvoice ? data.taxId : undefined,
                    taxAddress: data.needTaxInvoice ? data.taxAddress : undefined,
                    taxSubDistrict: data.needTaxInvoice ? data.taxSubDistrict : undefined,
                    taxDistrict: data.needTaxInvoice ? data.taxDistrict : undefined,
                    taxProvince: data.needTaxInvoice ? data.taxProvince : undefined,
                    taxPostalCode: data.needTaxInvoice ? data.taxPostalCode : undefined,
                };

                if (!Number.isInteger(parsedEventId) || parsedEventId <= 0) {
                    throw new Error('Invalid event context for checkout');
                }

                setStatus('submitting');

                const result = await paymentsApi.createIntent(requestBody);

                if (result.success && result.free) {
                    // Free registration — already completed on backend
                    sessionStorage.removeItem('checkout-payment-data');
                    sessionStorage.removeItem('payment-gateway');
                    sessionStorage.removeItem('payment-orderRef');
                    sessionStorage.removeItem('payment-refno');
                    sessionStorage.setItem('payment-event-id', data.eventId);
                    const resultParams = new URLSearchParams({
                        free: '1',
                        orderNumber: result.orderNumber || '',
                        regCode: result.regCode || '',
                    });

                    if (data.originApp) {
                        resultParams.set('originApp', data.originApp);
                    }

                    if (data.returnTo) {
                        resultParams.set('returnTo', data.returnTo);
                    }

                    router.push(`/checkout/payment/result?${resultParams.toString()}`);
                    return;
                }

                if (result.success && result.redirectForm) {
                    const resolvedGateway = result.gateway === 'ktb' ? 'ktb' : 'paysolutions';
                    setGateway(resolvedGateway);
                    sessionStorage.setItem('payment-gateway', resolvedGateway);
                    sessionStorage.removeItem('payment-refno');
                    sessionStorage.removeItem('payment-orderRef');

                    if (resolvedGateway === 'ktb') {
                        const orderRef = result.orderRef || result.refno;
                        if (orderRef) {
                            sessionStorage.setItem('payment-orderRef', orderRef);
                        }
                    } else if (result.refno) {
                        sessionStorage.setItem('payment-refno', result.refno);
                    }

                    sessionStorage.setItem('payment-event-id', data.eventId);

                    // Set form data for auto-submit
                    setFormData(result.redirectForm);
                } else {
                    throw new Error('Invalid response from create-intent');
                }
            } catch (error) {
                const msg = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการสร้างรายการชำระเงิน';
                setErrorMessage(msg);
                setStatus('error');
            }
        };

        createPaymentIntent();
    }, [authLoading, isLoggedIn, router]);

    // Auto-submit the form once formData is set
    useEffect(() => {
        if (formData && formRef.current && !hasSubmitted.current) {
            hasSubmitted.current = true;
            // Small delay to ensure form is rendered
            setTimeout(() => {
                formRef.current?.submit();
            }, 100);
        }
    }, [formData]);

    if (status === 'error') {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Navbar />
                <div className="flex-grow flex items-center justify-center px-4">
                    <div className="text-center space-y-4 max-w-md">
                        <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
                        <h2 className="text-xl font-bold text-gray-700">เกิดข้อผิดพลาด</h2>
                        <p className="text-gray-500 text-sm">{errorMessage}</p>
                        <div className="flex gap-3 justify-center pt-2">
                            <button
                                onClick={() => router.back()}
                                className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
                            >
                                ย้อนกลับ
                            </button>
                            <button
                                onClick={() => {
                                    setStatus('loading');
                                    setErrorMessage('');
                                    hasSubmitted.current = false;
                                    window.location.reload();
                                }}
                                className="px-5 py-2.5 bg-[#8a8a00] text-white font-medium rounded-lg hover:bg-[#456339] transition-colors text-sm"
                            >
                                ลองใหม่
                            </button>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />
            <div className="flex-grow flex items-center justify-center px-4">
                <div className="text-center space-y-4 max-w-md">
                    <div className="w-20 h-20 mx-auto bg-[#8a8a00]/10 rounded-full flex items-center justify-center">
                        <ShieldCheck className="w-10 h-10 text-[#8a8a00]" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">กำลังนำคุณไปยังหน้าชำระเงิน</h2>
                    <p className="text-gray-500 text-sm">ระบบกำลังเชื่อมต่อกับ payment gateway...</p>
                    <Loader2 className="w-8 h-8 animate-spin text-[#8a8a00] mx-auto" />
                    <p className="text-xs text-gray-400">กรุณาอย่าปิดหน้านี้</p>
                </div>
            </div>
            <Footer />

            {/* Hidden form for payment gateway redirect */}
            {formData && (
                <form
                    ref={formRef}
                    action={formData.actionUrl}
                    method="POST"
                    style={{ display: 'none' }}
                >
                    {Object.entries(formData.fields).map(([name, value]) => (
                        <input key={name} type="hidden" name={name} value={value} />
                    ))}
                </form>
            )}
        </div>
    );
}
