'use client';

import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { calculatePaySolutionsFeeExact, resolvePaySolutionsFeeMethod } from '@/lib/paySolutionsFee';
import type { PackageOption } from './PackageSelector';
import type { AddonOption } from './AddonSelector';
import { PromoCodeSection } from './PromoCodeSection';

interface OrderSummaryProps {
    eventName: string;
    selectedPackage: string;
    selectedAddOns: string[];
    packages: PackageOption[];
    addons: AddonOption[];
    currency: 'THB' | 'USD';
    paymentMethod: 'qr' | 'card';
    isAddonOnly?: boolean;
    // Promo
    promoCode: string;
    promoApplied: boolean;
    onPromoCodeChange: (code: string) => void;
    onApplyPromo: () => Promise<void>;
    onRemovePromo: () => void;
    promoError?: string | null;
    promoDiscountAmount?: number;
    promoDiscountText?: string | null;
    // Actions
    onSubmit: () => void;
    isSubmitting: boolean;
    canSubmit: boolean;
}

export function OrderSummary({
    eventName,
    selectedPackage,
    selectedAddOns,
    packages,
    addons,
    currency,
    paymentMethod,
    isAddonOnly,
    promoCode,
    promoApplied,
    onPromoCodeChange,
    onApplyPromo,
    onRemovePromo,
    promoError,
    promoDiscountAmount = 0,
    promoDiscountText,
    onSubmit,
    isSubmitting,
    canSubmit,
}: OrderSummaryProps) {
    const currencySymbol = currency === 'USD' ? '$' : '฿';

    const formatPrice = (price: number) =>
        `${currencySymbol}${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const selectedPkg = packages.find((p) => p.id === selectedPackage);
    const selectedAddonItems = addons.filter((a) => selectedAddOns.includes(a.groupName));

    const subtotal = useMemo(() => {
        const pkgPrice = isAddonOnly ? 0 : (selectedPkg?.price || 0);
        const addonsPrice = selectedAddonItems.reduce((sum, a) => sum + a.price, 0);
        return pkgPrice + addonsPrice;
    }, [isAddonOnly, selectedPkg, selectedAddonItems]);

    const netAmount = Math.max(0, subtotal - promoDiscountAmount);

    const feeBreakdown = useMemo(() => {
        const feeMethod = resolvePaySolutionsFeeMethod(paymentMethod, currency);
        return calculatePaySolutionsFeeExact(netAmount, feeMethod);
    }, [netAmount, paymentMethod, currency]);

    const hasItems = isAddonOnly ? selectedAddOns.length > 0 : !!selectedPackage;

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg sticky top-24">
            <div className="p-5 border-b border-gray-100">
                <h3 className="font-bold text-[#737300]">สรุปรายการ</h3>
            </div>

            <div className="p-5 space-y-4">
                <div className="text-sm text-gray-600">
                    <span className="font-medium text-gray-900">{eventName}</span>
                </div>

                {/* Package */}
                {!isAddonOnly && selectedPkg && (
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{selectedPkg.name}</span>
                        <span className="text-gray-900 font-medium">{formatPrice(selectedPkg.price)}</span>
                    </div>
                )}

                {isAddonOnly && (
                    <div className="text-xs text-[#8a8a00] font-medium">ซื้อ Add-on เพิ่ม</div>
                )}

                {/* Add-ons */}
                {selectedAddonItems.length > 0 && (
                    <div className="space-y-2 pb-3 border-b border-gray-100">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Add-ons</div>
                        {selectedAddonItems.map((addon) => (
                            <div key={addon.id} className="flex justify-between text-sm">
                                <span className="text-[#8a8a00]">+ {addon.name}</span>
                                <span className="text-[#8a8a00]">{formatPrice(addon.price)}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Promo Code */}
                {hasItems && (
                    <PromoCodeSection
                        promoCode={promoCode}
                        promoApplied={promoApplied}
                        onPromoCodeChange={onPromoCodeChange}
                        onApply={onApplyPromo}
                        onRemove={onRemovePromo}
                        error={promoError}
                        discountText={promoDiscountText}
                    />
                )}

                {/* Price breakdown */}
                {hasItems && (
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>ราคาตั๋วและบริการ</span>
                            <span>{formatPrice(subtotal)}</span>
                        </div>

                        {promoDiscountAmount > 0 && (
                            <div className="flex justify-between text-sm text-green-600">
                                <span>ส่วนลด</span>
                                <span>-{formatPrice(promoDiscountAmount)}</span>
                            </div>
                        )}

                        <div className="flex justify-between text-sm text-gray-500">
                            <span>ค่าธรรมเนียมการชำระเงิน</span>
                            <span>{formatPrice(feeBreakdown.fee)}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 text-right -mt-1">
                            (Processing Fee {formatPrice(feeBreakdown.processingFee)} + VAT 7% {formatPrice(feeBreakdown.processingVat)})
                        </div>

                        <div className="flex justify-between items-center text-lg font-bold text-[#8a8a00] pt-3 border-t border-[#8a8a00]/20">
                            <span>ยอดชำระสุทธิ</span>
                            <span>{formatPrice(feeBreakdown.total)}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-5 pt-0">
                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={!canSubmit || isSubmitting}
                    className="w-full h-12 bg-[#8a8a00] hover:bg-[#456339] text-white font-semibold rounded-xl shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            กำลังดำเนินการ...
                        </>
                    ) : (
                        `ชำระเงิน ${hasItems ? formatPrice(feeBreakdown.total) : ''}`
                    )}
                </button>
            </div>
        </div>
    );
}
