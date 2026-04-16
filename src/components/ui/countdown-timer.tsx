'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
    targetDate: string;
    endDate?: string;
    className?: string;
}

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

export function CountdownTimer({ targetDate, endDate, className = '' }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        const calculateTimeLeft = () => {
            const difference = new Date(targetDate).getTime() - new Date().getTime();

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    if (!mounted) {
        return null;
    }

    const now = new Date().getTime();
    const startPast = new Date(targetDate).getTime() < now;
    const endPast = endDate ? new Date(endDate).getTime() < now : startPast;

    if (startPast && !endPast) {
        return (
            <div className={`text-center ${className}`}>
                <div className="text-sm text-gray-400 mb-2">Event Status</div>
                <div className="text-lg font-bold text-[#8a8a00]">Event is ongoing</div>
            </div>
        );
    }

    if (endPast) {
        return (
            <div className={`text-center ${className}`}>
                <div className="text-sm text-gray-400 mb-2">Event Status</div>
                <div className="text-lg font-bold text-gray-500">Event has ended</div>
            </div>
        );
    }

    return (
        <div className={`${className}`}>
            <div className="text-sm text-gray-400 mb-3 text-center">Event starts in</div>
            <div className="grid grid-cols-4 gap-2">
                <div className="bg-[#8a8a00]/10 border border-[#8a8a00]/20 rounded-xl p-3 text-center">
                    <div className="text-2xl md:text-3xl font-bold text-[#8a8a00]">{timeLeft.days}</div>
                    <div className="text-xs text-gray-400">Days</div>
                </div>
                <div className="bg-[#8a8a00]/10 border border-[#8a8a00]/20 rounded-xl p-3 text-center">
                    <div className="text-2xl md:text-3xl font-bold text-[#8a8a00]">{timeLeft.hours.toString().padStart(2, '0')}</div>
                    <div className="text-xs text-gray-400">Hours</div>
                </div>
                <div className="bg-[#8a8a00]/10 border border-[#8a8a00]/20 rounded-xl p-3 text-center">
                    <div className="text-2xl md:text-3xl font-bold text-[#8a8a00]">{timeLeft.minutes.toString().padStart(2, '0')}</div>
                    <div className="text-xs text-gray-400">Mins</div>
                </div>
                <div className="bg-[#8a8a00]/10 border border-[#8a8a00]/20 rounded-xl p-3 text-center">
                    <div className="text-2xl md:text-3xl font-bold text-[#8a8a00] animate-pulse">{timeLeft.seconds.toString().padStart(2, '0')}</div>
                    <div className="text-xs text-gray-400">Secs</div>
                </div>
            </div>
        </div>
    );
}
