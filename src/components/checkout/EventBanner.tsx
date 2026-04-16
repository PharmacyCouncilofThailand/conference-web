'use client';

import { Calendar, MapPin, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface EventBannerProps {
    eventName: string;
    startDate?: string;
    endDate?: string;
    location?: string | null;
    imageUrl?: string | null;
    backUrl: string;
    backLabel: string;
    isAddonOnly?: boolean;
    primaryTicketName?: string | null;
}

export function EventBanner({
    eventName,
    startDate,
    endDate,
    location,
    imageUrl,
    backUrl,
    backLabel,
    isAddonOnly,
    primaryTicketName,
}: EventBannerProps) {
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {imageUrl && (
                <div className="h-32 sm:h-40 relative overflow-hidden">
                    <img src={imageUrl} alt={eventName} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                        <h2 className="text-white text-lg sm:text-xl font-bold drop-shadow-lg">{eventName}</h2>
                    </div>
                </div>
            )}
            <div className="p-4 space-y-3">
                {!imageUrl && (
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">{eventName}</h2>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {startDate && (
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-[#8a8a00]" />
                            {formatDate(startDate)}
                            {endDate && ` - ${formatDate(endDate)}`}
                        </span>
                    )}
                    {location && (
                        <span className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-[#8a8a00]" />
                            {location}
                        </span>
                    )}
                </div>

                {isAddonOnly && primaryTicketName && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                        <span className="text-green-700 font-medium">
                            ✅ คุณลงทะเบียนแล้ว: {primaryTicketName}
                        </span>
                        <p className="text-green-600 text-xs mt-1">เลือก Add-on เพิ่มเติมด้านล่าง</p>
                    </div>
                )}

                <Link
                    href={backUrl}
                    className="inline-flex items-center gap-1.5 text-sm text-[#8a8a00] hover:text-[#456339] transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {backLabel}
                </Link>
            </div>
        </div>
    );
}
