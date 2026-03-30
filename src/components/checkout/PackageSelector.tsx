'use client';

import { Check, Lock } from 'lucide-react';

export interface PackageOption {
    id: string;
    groupName: string;
    name: string;
    price: number;
    currency: string;
    description?: string | null;
    features?: string[];
    badgeText?: string | null;
    originalPrice?: number | null;
    available: number;
    isActive: boolean;
}

interface PackageSelectorProps {
    packages: PackageOption[];
    selectedPackage: string;
    onSelect: (groupName: string) => void;
    isAddonOnly?: boolean;
    primaryTicketName?: string | null;
    currency: 'THB' | 'USD';
}

export function PackageSelector({
    packages,
    selectedPackage,
    onSelect,
    isAddonOnly,
    primaryTicketName,
    currency,
}: PackageSelectorProps) {
    const currencySymbol = currency === 'USD' ? '$' : '฿';

    const formatPrice = (price: number) =>
        `${currencySymbol}${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (isAddonOnly) {
        return (
            <div className="space-y-3">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-3 opacity-70">
                    <div className="w-6 h-6 rounded-full bg-[#537547] flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                        <div className="font-medium text-gray-700">{primaryTicketName || 'ตั๋วหลัก'}</div>
                        <div className="text-xs text-gray-500">ซื้อแล้ว</div>
                    </div>
                    <Lock className="w-4 h-4 text-gray-400" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {packages.map((pkg) => {
                const isSelected = selectedPackage === pkg.groupName;
                const isSoldOut = pkg.available <= 0;

                return (
                    <button
                        key={pkg.id}
                        type="button"
                        onClick={() => !isSoldOut && onSelect(pkg.groupName)}
                        disabled={isSoldOut}
                        className={`w-full text-left border rounded-xl p-4 transition-all duration-200 ${
                            isSelected
                                ? 'border-[#537547] bg-[#537547]/5 ring-2 ring-[#537547]/20'
                                : isSoldOut
                                    ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                                    : 'border-gray-200 bg-white hover:border-[#537547]/40 hover:shadow-sm'
                        }`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1">
                                <div
                                    className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                        isSelected
                                            ? 'border-[#537547] bg-[#537547]'
                                            : 'border-gray-300'
                                    }`}
                                >
                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-900">{pkg.name}</span>
                                        {pkg.badgeText && (
                                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                                                {pkg.badgeText}
                                            </span>
                                        )}
                                        {isSoldOut && (
                                            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                                                เต็มแล้ว
                                            </span>
                                        )}
                                    </div>
                                    {pkg.description && (
                                        <p className="text-sm text-gray-500 mt-1">{pkg.description}</p>
                                    )}
                                    {pkg.features && pkg.features.length > 0 && (
                                        <ul className="mt-2 space-y-1">
                                            {pkg.features.map((f, i) => (
                                                <li key={i} className="text-xs text-gray-500 flex items-center gap-1.5">
                                                    <Check className="w-3 h-3 text-[#537547]" />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                                {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                                    <div className="text-xs text-gray-400 line-through">
                                        {formatPrice(pkg.originalPrice)}
                                    </div>
                                )}
                                <div className={`font-bold ${isSelected ? 'text-[#537547]' : 'text-gray-900'}`}>
                                    {formatPrice(pkg.price)}
                                </div>
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
