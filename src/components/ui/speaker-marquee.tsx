'use client';

import { Speaker } from '@/types';

interface SpeakerMarqueeProps {
    speakers: Speaker[];
}

export function SpeakerMarquee({ speakers }: SpeakerMarqueeProps) {
    if (!speakers || speakers.length === 0) return null;

    // Duplicate for seamless loop
    const duplicatedSpeakers = [...speakers, ...speakers];

    return (
        <div className="relative overflow-hidden py-6">
            {/* Gradient masks */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

            {/* Marquee track */}
            <div className="flex gap-6 animate-marquee hover:[animation-play-state:paused]">
                {duplicatedSpeakers.map((speaker, index) => (
                    <div
                        key={`${speaker.id}-${index}`}
                        className="flex-shrink-0 flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 min-w-[280px] md:min-w-[320px] hover:bg-gray-100 hover:border-[#8a8a00]/30 transition-colors cursor-pointer"
                    >
                        <img
                            src={speaker.imageUrl || 'https://via.placeholder.com/80'}
                            alt={speaker.name}
                            className="w-14 h-14 rounded-full object-cover border-2 border-[#8a8a00]/50"
                        />
                        <div className="overflow-hidden">
                            <div className="font-bold text-[#737300] truncate">{speaker.name}</div>
                            <div className="text-sm text-[#8a8a00] truncate">{speaker.title}</div>
                            <div className="text-xs text-gray-500 truncate">{speaker.organization}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
