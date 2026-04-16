'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '@/lib/api/events';
import { paymentsApi } from '@/lib/api/payments';
import { useAuth } from '@/contexts/AuthContext';
import { useCheckoutWizard } from '@/hooks/checkout/useCheckoutWizard';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { EventBanner } from '@/components/checkout/EventBanner';
import { StepIndicator } from '@/components/checkout/StepIndicator';
import { PackageSelector } from '@/components/checkout/PackageSelector';
import type { PackageOption } from '@/components/checkout/PackageSelector';
import { AddonSelector } from '@/components/checkout/AddonSelector';
import type { AddonOption } from '@/components/checkout/AddonSelector';
import { TaxInvoiceSection } from '@/components/checkout/TaxInvoiceSection';
import { PaymentMethodCard } from '@/components/checkout/PaymentMethodCard';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { User, Mail, Phone, Globe, Lock, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const eventId = params.id as string;
    const modeParam = searchParams.get('mode');
    const originApp = searchParams.get('originApp');
    const returnTo = searchParams.get('returnTo');

    const { user, token, isLoggedIn, isLoading: authLoading } = useAuth();

    const {
        currentStep, checkoutData, steps, updateCheckoutData,
        nextStep, prevStep, goToStep, resetWizard,
        isCurrentStepValid, canProceedToPayment,
    } = useCheckoutWizard(eventId);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [promoError, setPromoError] = useState<string | null>(null);
    const [promoDiscountAmount, setPromoDiscountAmount] = useState(0);
    const [promoDiscountText, setPromoDiscountText] = useState<string | null>(null);

    // Fetch event data
    const { data: eventData, isLoading: eventLoading, isError: eventError } = useQuery({
        queryKey: ['event', eventId],
        queryFn: () => eventsApi.get(Number(eventId)),
        enabled: !!eventId,
        retry: 1,
    });

    const event = eventData?.data;

    // Fetch purchase status (for addon-only detection)
    const { data: purchasesData } = useQuery({
        queryKey: ['my-purchases', eventId],
        queryFn: () => paymentsApi.myPurchases(Number(eventId)),
        enabled: isLoggedIn && !!eventId,
    });

    const purchases = purchasesData?.data;

    // Currency detection from user.delegateType
    const isThai = useMemo(() => {
        return user?.delegateType?.startsWith('thai') ?? true;
    }, [user?.delegateType]);

    const currency: 'THB' | 'USD' = isThai ? 'THB' : 'USD';
    const currentCheckoutPath = useMemo(() => {
        const currentParams = new URLSearchParams(searchParams.toString());
        const query = currentParams.toString();
        return `/checkout/${eventId}${query ? `?${query}` : ''}`;
    }, [eventId, searchParams]);

    // Auto-detect addon-only mode
    useEffect(() => {
        if (purchases?.hasPrimaryTicket || modeParam === 'addon') {
            updateCheckoutData({
                isAddonOnly: true,
                purchasedAddOns: purchases?.purchasedAddOns || [],
            });
        }
    }, [purchases, modeParam, updateCheckoutData]);

    // Set currency
    useEffect(() => {
        updateCheckoutData({ currency });
    }, [currency, updateCheckoutData]);

    // Auto-switch QR to card for USD
    useEffect(() => {
        if (!isThai && checkoutData.paymentMethod === 'qr') {
            updateCheckoutData({ paymentMethod: 'card' });
        }
    }, [isThai, checkoutData.paymentMethod, updateCheckoutData]);

    // Pre-fill user info
    useEffect(() => {
        if (user && isLoggedIn) {
            updateCheckoutData({
                firstName: user.firstName || checkoutData.firstName,
                lastName: user.lastName || checkoutData.lastName,
                email: user.email || checkoutData.email,
                phone: user.phone || checkoutData.phone,
                country: user.country || checkoutData.country,
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, isLoggedIn]);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            router.push(`/login?redirect=${encodeURIComponent(currentCheckoutPath)}`);
        }
    }, [authLoading, currentCheckoutPath, isLoggedIn, router]);

    // Build package and addon options from event ticket types
    const { packageOptions, addonOptions } = useMemo(() => {
        if (!event?.ticketTypes) return { packageOptions: [], addonOptions: [] };

        const userRole = user?.role || 'public';
        const userStudentLevel = user?.studentLevel || null;
        const isTicketAllowedForUser = (tt: { allowedRoles?: string[]; allowedStudentLevels?: string[] }) => {
            if (!tt.allowedRoles || tt.allowedRoles.length === 0) return true;
            const role = userRole === 'public' ? 'general' : userRole;
            if (!tt.allowedRoles.includes(role)) return false;
            // For student tickets, also check studentLevel if specified
            if (role === 'student' && tt.allowedStudentLevels && tt.allowedStudentLevels.length > 0 && userStudentLevel) {
                return tt.allowedStudentLevels.includes(userStudentLevel);
            }
            return true;
        };

        const isTicketOnSale = (tt: { salesStart?: string; saleStartDate?: string; salesEnd?: string; saleEndDate?: string }) => {
            const now = new Date();
            const start = tt.salesStart || tt.saleStartDate;
            const end = tt.salesEnd || tt.saleEndDate;
            if (start && now < new Date(start)) return false;
            if (end && now > new Date(end)) return false;
            return true;
        };

        const pkgs: PackageOption[] = [];
        const addons: AddonOption[] = [];

        for (const tt of event.ticketTypes) {
            if (!isTicketAllowedForUser(tt)) continue;
            if (!isTicketOnSale(tt)) continue;

            const priority: string = (tt as any).priority ?? 'regular';
            const baseOption = {
                id: String(tt.id),
                groupName: tt.groupName || tt.name,
                name: tt.name,
                price: Number(tt.price || 0),
                currency: tt.currency || 'THB',
                description: tt.description || null,
                features: Array.isArray(tt.features) ? tt.features : [],
                badgeText: tt.badgeText || null,
                originalPrice: tt.originalPrice ? Number(tt.originalPrice) : null,
                available: (tt.quota || 0) - (tt.soldCount || 0),
                isActive: tt.isActive !== false,
                priority,
            };

            if (tt.category === 'primary') {
                // Filter by currency
                if ((currency === 'THB' && (tt.currency === 'THB' || !tt.currency)) ||
                    (currency === 'USD' && tt.currency === 'USD')) {
                    pkgs.push(baseOption);
                }
            } else if (tt.category === 'addon') {
                // Include sessions for workshop tickets
                const addonOption: AddonOption = {
                    ...baseOption,
                    sessions: tt.sessions?.map(s => ({
                        id: s.id,
                        sessionName: s.sessionName,
                        startTime: s.startTime || '',
                        endTime: s.endTime || '',
                        room: s.room,
                        maxCapacity: s.maxCapacity,
                    })),
                };
                addons.push(addonOption);
            }
        }

        const priorityOrder: Record<string, number> = { early_bird: 0, regular: 1 };
        pkgs.sort((a, b) => (priorityOrder[(a as any).priority] ?? 1) - (priorityOrder[(b as any).priority] ?? 1));

        return { packageOptions: pkgs, addonOptions: addons };
    }, [event?.ticketTypes, currency, user?.role]);

    // Smart back link
    const backUrl = useMemo(() => {
        if (event?.websiteUrl) return event.websiteUrl;
        return `/events/${eventId}`;
    }, [event?.websiteUrl, eventId]);

    const backLabel = event?.websiteUrl
        ? `กลับไปหน้า ${event?.eventName || 'Event'}`
        : 'กลับหน้า Event';

    // Promo code apply
    const handleApplyPromo = useCallback(async () => {
        if (!checkoutData.promoCode.trim()) return;
        setPromoError(null);

        try {
            const result = await paymentsApi.preview({
                eventId: Number(eventId),
                packageId: checkoutData.isAddonOnly ? '' : checkoutData.selectedPackage,
                addOnIds: checkoutData.selectedAddOns,
                currency,
                paymentMethod: checkoutData.paymentMethod,
                promoCode: checkoutData.promoCode,
            });

            if (result.promoValid) {
                updateCheckoutData({ promoApplied: true });
                setPromoDiscountAmount(result.discountAmount);
                const typeText = result.discountType === 'percentage'
                    ? `${result.discountValue}%`
                    : `${currency === 'USD' ? '$' : '฿'}${result.discountValue}`;
                setPromoDiscountText(`ลด ${typeText}`);
            } else {
                setPromoError(result.promoError || 'โค้ดส่วนลดไม่ถูกต้อง');
            }
        } catch (err) {
            setPromoError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
        }
    }, [checkoutData, currency, updateCheckoutData]);

    const handleRemovePromo = useCallback(() => {
        updateCheckoutData({ promoCode: '', promoApplied: false });
        setPromoDiscountAmount(0);
        setPromoDiscountText(null);
        setPromoError(null);
    }, [updateCheckoutData]);

    // Submit: save checkout data to sessionStorage and navigate to payment page
    const handleSubmit = useCallback(async () => {
        if (!canProceedToPayment() || isSubmitting) return;
        setIsSubmitting(true);

        try {
            // Save all checkout data + eventId to sessionStorage for payment page
            sessionStorage.setItem('checkout-payment-data', JSON.stringify({
                ...checkoutData,
                eventId,
                currency,
                originApp,
                returnTo,
                websiteUrl: event?.websiteUrl || null,
            }));

            router.push('/checkout/payment');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'กรุณาลองใหม่อีกครั้ง';
            alert(`เกิดข้อผิดพลาด: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    }, [canProceedToPayment, isSubmitting, checkoutData, eventId, currency, originApp, returnTo, event?.websiteUrl, router]);

    // Loading states
    if (authLoading || eventLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center space-y-3">
                    <Loader2 className="w-10 h-10 animate-spin text-[#8a8a00] mx-auto" />
                    <p className="text-gray-500 text-sm">กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    if (eventError || !event) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Navbar />
                <div className="flex-grow flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
                        <h2 className="text-xl font-bold text-gray-700">ไม่พบ Event</h2>
                        <Link href="/events" className="text-[#8a8a00] hover:underline text-sm">
                            กลับหน้ารายการ
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
            <Navbar />

            <div className="flex-grow pt-28 pb-20 px-4 md:px-6">
                <div className="container mx-auto max-w-6xl">
                    {/* Event Banner */}
                    <div className="mb-6">
                        <EventBanner
                            eventName={event.eventName}
                            startDate={event.startDate}
                            endDate={event.endDate}
                            location={event.location}
                            imageUrl={event.coverImage || event.imageUrl}
                            backUrl={backUrl}
                            backLabel={backLabel}
                            isAddonOnly={checkoutData.isAddonOnly}
                            primaryTicketName={purchases?.primaryTicketName}
                        />
                    </div>

                    {/* Step Indicator */}
                    <div className="mb-8 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                        <StepIndicator
                            steps={steps}
                            currentStep={currentStep}
                            onStepClick={goToStep}
                        />
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Left: Wizard Steps */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Step 1: Personal Info */}
                            {currentStep === 1 && (
                                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <User className="w-5 h-5 text-[#8a8a00]" />
                                        ข้อมูลส่วนตัว
                                    </h3>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-gray-700">ชื่อ <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                value={checkoutData.firstName}
                                                onChange={(e) => updateCheckoutData({ firstName: e.target.value })}
                                                placeholder="John"
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:border-[#8a8a00] focus:ring-1 focus:ring-[#8a8a00] outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-gray-700">นามสกุล <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                value={checkoutData.lastName}
                                                onChange={(e) => updateCheckoutData({ lastName: e.target.value })}
                                                placeholder="Doe"
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:border-[#8a8a00] focus:ring-1 focus:ring-[#8a8a00] outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                                <Mail className="w-3.5 h-3.5" /> อีเมล <span className="text-red-500">*</span>
                                                {isLoggedIn && <Lock className="w-3 h-3 text-[#8a8a00]" />}
                                            </label>
                                            <input
                                                type="email"
                                                value={checkoutData.email}
                                                onChange={(e) => updateCheckoutData({ email: e.target.value })}
                                                placeholder="john@example.com"
                                                disabled={isLoggedIn}
                                                className={`w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:border-[#8a8a00] focus:ring-1 focus:ring-[#8a8a00] outline-none ${isLoggedIn ? 'opacity-70 cursor-not-allowed bg-gray-50' : ''}`}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                                <Phone className="w-3.5 h-3.5" /> เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                value={checkoutData.phone}
                                                onChange={(e) => updateCheckoutData({ phone: e.target.value })}
                                                placeholder="0812345678"
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:border-[#8a8a00] focus:ring-1 focus:ring-[#8a8a00] outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                            <Globe className="w-3.5 h-3.5" /> ประเทศ
                                        </label>
                                        <input
                                            type="text"
                                            value={checkoutData.country}
                                            onChange={(e) => updateCheckoutData({ country: e.target.value })}
                                            placeholder="Thailand"
                                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:border-[#8a8a00] focus:ring-1 focus:ring-[#8a8a00] outline-none"
                                        />
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="button"
                                            onClick={nextStep}
                                            disabled={!isCurrentStepValid()}
                                            className="px-6 py-2.5 bg-[#8a8a00] text-white font-medium rounded-lg hover:bg-[#456339] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            ถัดไป
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Package + Add-ons */}
                            {currentStep === 2 && (
                                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
                                    <h3 className="text-lg font-bold text-gray-900">
                                        {checkoutData.isAddonOnly ? 'เลือก Add-on เพิ่มเติม' : 'เลือกแพ็กเกจ'}
                                    </h3>

                                    {/* Package Selection */}
                                    <PackageSelector
                                        packages={packageOptions}
                                        selectedPackage={checkoutData.selectedPackage}
                                        onSelect={(groupName) => updateCheckoutData({ selectedPackage: groupName })}
                                        isAddonOnly={checkoutData.isAddonOnly}
                                        primaryTicketName={purchases?.primaryTicketName}
                                        currency={currency}
                                    />

                                    {/* Add-on Selection */}
                                    {addonOptions.length > 0 && (
                                        <div className="pt-4 border-t border-gray-100 space-y-3">
                                            <h4 className="font-semibold text-gray-800">Add-ons</h4>
                                            <AddonSelector
                                                addons={addonOptions}
                                                selectedAddOns={checkoutData.selectedAddOns}
                                                onToggle={(groupName) => {
                                                    const current = checkoutData.selectedAddOns;
                                                    const updated = current.includes(groupName)
                                                        ? current.filter(a => a !== groupName)
                                                        : [...current, groupName];
                                                    updateCheckoutData({ selectedAddOns: updated });
                                                }}
                                                purchasedAddOns={checkoutData.purchasedAddOns}
                                                currency={currency}
                                                selectedWorkshopTopic={checkoutData.selectedWorkshopTopic}
                                                onWorkshopTopicChange={(id) => updateCheckoutData({ selectedWorkshopTopic: id })}
                                                dietaryRequirement={checkoutData.dietaryRequirement}
                                                onDietaryChange={(val) => updateCheckoutData({ dietaryRequirement: val })}
                                                dietaryOtherText={checkoutData.dietaryOtherText}
                                                onDietaryOtherChange={(val) => updateCheckoutData({ dietaryOtherText: val })}
                                            />
                                        </div>
                                    )}

                                    <div className="flex justify-between pt-2">
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            ย้อนกลับ
                                        </button>
                                        <button
                                            type="button"
                                            onClick={nextStep}
                                            disabled={!isCurrentStepValid()}
                                            className="px-6 py-2.5 bg-[#8a8a00] text-white font-medium rounded-lg hover:bg-[#456339] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            ถัดไป
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Tax Invoice */}
                            {currentStep === 3 && (
                                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
                                    <h3 className="text-lg font-bold text-gray-900">ใบกำกับภาษี</h3>

                                    <TaxInvoiceSection
                                        needTaxInvoice={checkoutData.needTaxInvoice}
                                        onNeedTaxInvoiceChange={(val) => updateCheckoutData({ needTaxInvoice: val })}
                                        taxName={checkoutData.taxName}
                                        taxId={checkoutData.taxId}
                                        taxAddress={checkoutData.taxAddress}
                                        taxSubDistrict={checkoutData.taxSubDistrict}
                                        taxDistrict={checkoutData.taxDistrict}
                                        taxProvince={checkoutData.taxProvince}
                                        taxPostalCode={checkoutData.taxPostalCode}
                                        onFieldChange={(field, value) => updateCheckoutData({ [field]: value })}
                                    />

                                    <div className="flex justify-between pt-2">
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            ย้อนกลับ
                                        </button>
                                        <button
                                            type="button"
                                            onClick={nextStep}
                                            disabled={!isCurrentStepValid()}
                                            className="px-6 py-2.5 bg-[#8a8a00] text-white font-medium rounded-lg hover:bg-[#456339] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            ถัดไป
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Payment Method */}
                            {currentStep === 4 && (
                                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
                                    <h3 className="text-lg font-bold text-gray-900">วิธีชำระเงิน</h3>

                                    <PaymentMethodCard
                                        paymentMethod={checkoutData.paymentMethod}
                                        onSelect={(method) => updateCheckoutData({ paymentMethod: method })}
                                        isThai={isThai}
                                    />

                                    <div className="flex justify-between pt-2">
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            ย้อนกลับ
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right: Order Summary */}
                        <div className="lg:col-span-1">
                            <OrderSummary
                                eventName={event.eventName}
                                selectedPackage={checkoutData.selectedPackage}
                                selectedAddOns={checkoutData.selectedAddOns}
                                packages={packageOptions}
                                addons={addonOptions}
                                currency={currency}
                                paymentMethod={checkoutData.paymentMethod}
                                isAddonOnly={checkoutData.isAddonOnly}
                                promoCode={checkoutData.promoCode}
                                promoApplied={checkoutData.promoApplied}
                                onPromoCodeChange={(code) => updateCheckoutData({ promoCode: code })}
                                onApplyPromo={handleApplyPromo}
                                onRemovePromo={handleRemovePromo}
                                promoError={promoError}
                                promoDiscountAmount={promoDiscountAmount}
                                promoDiscountText={promoDiscountText}
                                onSubmit={handleSubmit}
                                isSubmitting={isSubmitting}
                                canSubmit={canProceedToPayment()}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
