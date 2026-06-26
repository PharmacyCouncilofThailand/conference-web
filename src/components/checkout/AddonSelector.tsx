'use client';

import { Check, X } from 'lucide-react';
import { formatStudentLevelList, isTicketSoldOut } from '@/lib/utils';

export interface AddonOption {
    id: string;
    groupName: string;
    name: string;
    price: number;
    currency: string;
    description?: string | null;
    quota: number;
    soldCount: number;
    available: number;
    isActive: boolean;
    allowedRoles?: string[];
    allowedStudentLevels?: string[];
    // Workshop-specific
    sessions?: Array<{
        id: number;
        sessionName: string;
        startTime: string;
        endTime: string;
        room?: string | null;
        maxCapacity?: number;
    }>;
}

interface AddonSelectorProps {
    addons: AddonOption[];
    selectedAddOns: string[];
    onToggle: (groupName: string) => void;
    purchasedAddOns?: string[];
    currency: 'THB' | 'USD';
    // Workshop topic selection
    selectedWorkshopTopic?: string;
    onWorkshopTopicChange?: (sessionId: string) => void;
    // Dietary requirement (for gala)
    dietaryRequirement?: string;
    onDietaryChange?: (value: string) => void;
    dietaryOtherText?: string;
    onDietaryOtherChange?: (value: string) => void;
}

const DIETARY_OPTIONS = [
    { value: '', label: 'ไม่ระบุ' },
    { value: 'normal', label: 'ปกติ' },
    { value: 'halal', label: 'ฮาลาล' },
    { value: 'vegetarian', label: 'มังสวิรัติ' },
    { value: 'vegan', label: 'วีแกน' },
    { value: 'other', label: 'อื่นๆ' },
];

export function AddonSelector({
    addons,
    selectedAddOns,
    onToggle,
    purchasedAddOns = [],
    currency,
    selectedWorkshopTopic,
    onWorkshopTopicChange,
    dietaryRequirement,
    onDietaryChange,
    dietaryOtherText,
    onDietaryOtherChange,
}: AddonSelectorProps) {
    const currencySymbol = currency === 'USD' ? '$' : '฿';

    const formatPrice = (price: number) =>
        `${currencySymbol}${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (addons.length === 0) {
        return (
            <div className="text-sm text-gray-500 text-center py-4">
                ไม่มี Add-on สำหรับงานนี้
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {addons.map((addon) => {
                const isSelected = selectedAddOns.includes(addon.groupName);
                const isPurchased = purchasedAddOns.includes(addon.groupName.toLowerCase());
                const isSoldOut = isTicketSoldOut(addon.quota, addon.soldCount) && !isPurchased;
                const isGala = addon.groupName.toLowerCase() === 'gala';
                const isWorkshop = addon.groupName.toLowerCase() === 'workshop';

                return (
                    <div key={addon.id} className="space-y-2">
                        <button
                            type="button"
                            onClick={() => !isPurchased && !isSoldOut && onToggle(addon.groupName)}
                            disabled={isPurchased || isSoldOut}
                            className={`w-full text-left border rounded-xl p-4 transition-all duration-200 ${
                                isPurchased
                                    ? 'border-green-200 bg-green-50/50 opacity-70 cursor-not-allowed'
                                    : isSelected
                                        ? 'border-[#8a8a00] bg-[#8a8a00]/5'
                                        : isSoldOut
                                            ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                                            : 'border-gray-200 bg-white hover:border-[#8a8a00]/40'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 flex-1">
                                    <div
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                            isPurchased
                                                ? 'border-green-500 bg-green-500'
                                                : isSelected
                                                    ? 'border-[#8a8a00] bg-[#8a8a00]'
                                                    : 'border-gray-300'
                                        }`}
                                    >
                                        {(isSelected || isPurchased) && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900">{addon.name}</span>
                                            {isPurchased && (
                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                                    ซื้อแล้ว
                                                </span>
                                            )}
                                            {isSoldOut && (
                                                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                                                    เต็มแล้ว
                                                </span>
                                            )}
                                        </div>
                                        {addon.description && (
                                            <p className="text-xs text-gray-500 mt-0.5">{addon.description}</p>
                                        )}
                                        {addon.allowedRoles?.includes('student') && (
                                            <div className="mt-1 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                                                ระดับนักศึกษา: {formatStudentLevelList(addon.allowedStudentLevels)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className={`font-semibold flex-shrink-0 ${isSelected ? 'text-[#8a8a00]' : 'text-gray-700'}`}>
                                    {formatPrice(addon.price)}
                                </span>
                            </div>
                        </button>

                        {/* Gala dietary requirement */}
                        {isGala && isSelected && !isPurchased && onDietaryChange && (
                            <div className="ml-8 p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
                                <label className="text-sm font-medium text-gray-700">อาหาร (Dietary Requirement)</label>
                                <select
                                    value={dietaryRequirement || ''}
                                    onChange={(e) => onDietaryChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-[#8a8a00] focus:ring-1 focus:ring-[#8a8a00] outline-none"
                                >
                                    {DIETARY_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                {dietaryRequirement === 'other' && onDietaryOtherChange && (
                                    <input
                                        type="text"
                                        value={dietaryOtherText || ''}
                                        onChange={(e) => onDietaryOtherChange(e.target.value)}
                                        placeholder="ระบุอาหารที่ต้องการ"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-[#8a8a00] focus:ring-1 focus:ring-[#8a8a00] outline-none"
                                    />
                                )}
                            </div>
                        )}

                        {/* Workshop topic selection */}
                        {isWorkshop && isSelected && !isPurchased && addon.sessions && addon.sessions.length > 0 && onWorkshopTopicChange && (
                            <div className="ml-8 p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
                                <label className="text-sm font-medium text-gray-700">เลือก Workshop</label>
                                <div className="space-y-2">
                                    {addon.sessions.map((session) => (
                                        <button
                                            key={session.id}
                                            type="button"
                                            onClick={() => onWorkshopTopicChange(String(session.id))}
                                            className={`w-full text-left p-3 border rounded-lg text-sm transition-all ${
                                                selectedWorkshopTopic === String(session.id)
                                                    ? 'border-[#8a8a00] bg-[#8a8a00]/5'
                                                    : 'border-gray-200 bg-white hover:border-[#8a8a00]/40'
                                            }`}
                                        >
                                            <div className="font-medium text-gray-900">{session.sessionName}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">
                                                {session.room && `${session.room} · `}
                                                {new Date(session.startTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                                {' - '}
                                                {new Date(session.endTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
