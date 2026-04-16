'use client';

import { useState } from 'react';
import { Tag, X, Loader2, Check } from 'lucide-react';

interface PromoCodeSectionProps {
    promoCode: string;
    promoApplied: boolean;
    onPromoCodeChange: (code: string) => void;
    onApply: () => Promise<void>;
    onRemove: () => void;
    error?: string | null;
    discountText?: string | null;
}

export function PromoCodeSection({
    promoCode,
    promoApplied,
    onPromoCodeChange,
    onApply,
    onRemove,
    error,
    discountText,
}: PromoCodeSectionProps) {
    const [isApplying, setIsApplying] = useState(false);

    const handleApply = async () => {
        if (!promoCode.trim() || isApplying) return;
        setIsApplying(true);
        try {
            await onApply();
        } finally {
            setIsApplying(false);
        }
    };

    if (promoApplied) {
        return (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">{promoCode}</span>
                    {discountText && (
                        <span className="text-xs text-green-600">({discountText})</span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onRemove}
                    className="p-1 hover:bg-green-100 rounded transition-colors"
                >
                    <X className="w-4 h-4 text-green-600" />
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Tag className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => onPromoCodeChange(e.target.value.toUpperCase())}
                        placeholder="รหัสส่วนลด"
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-[#8a8a00] focus:ring-1 focus:ring-[#8a8a00] outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                    />
                </div>
                <button
                    type="button"
                    onClick={handleApply}
                    disabled={!promoCode.trim() || isApplying}
                    className="px-4 py-2 bg-[#8a8a00] text-white text-sm font-medium rounded-lg hover:bg-[#456339] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                >
                    {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ใช้โค้ด'}
                </button>
            </div>
            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}
        </div>
    );
}
