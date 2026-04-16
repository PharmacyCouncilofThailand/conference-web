'use client';

import { useEffect } from 'react';
import { useCounter } from '@/hooks/use-counter';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';

interface StatsSectionProps {
    yearsCount?: number;
    membersCount?: number;
    eventsCount?: number;
    cpeCount?: number;
}

export function StatsSection({
    yearsCount = 25,
    membersCount = 50000,
    eventsCount = 200,
    cpeCount = 15000,
}: StatsSectionProps) {
    const yearsCounter = useCounter(yearsCount, 2000);
    const membersCounter = useCounter(membersCount, 2500);
    const eventsCounter = useCounter(eventsCount, 2000);
    const cpeCounter = useCounter(cpeCount, 2500);

    const { ref, isVisible } = useScrollAnimation({ threshold: 0.3 });

    // Start counting when the section is visible
    useEffect(() => {
        if (isVisible) {
            yearsCounter.setIsVisible(true);
            membersCounter.setIsVisible(true);
            eventsCounter.setIsVisible(true);
            cpeCounter.setIsVisible(true);
        }
    }, [isVisible]);

    return (
        <section ref={ref} className="py-20 px-6">
            <div className="container mx-auto">
                <div className={`bg-[#8a8a00] rounded-3xl p-12 text-white scroll-animate scale-in ${isVisible ? 'is-visible' : ''}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div className={`scroll-animate fade-up stagger-1 ${isVisible ? 'is-visible' : ''}`}>
                            <div className="text-5xl font-bold text-white mb-2">
                                {yearsCounter.count}+
                            </div>
                            <div className="text-white/70">ปีแห่งประสบการณ์</div>
                        </div>
                        <div className={`scroll-animate fade-up stagger-2 ${isVisible ? 'is-visible' : ''}`}>
                            <div className="text-5xl font-bold text-white mb-2">
                                {(membersCounter.count / 1000).toFixed(0)}K+
                            </div>
                            <div className="text-white/70">สมาชิกเภสัชกร</div>
                        </div>
                        <div className={`scroll-animate fade-up stagger-3 ${isVisible ? 'is-visible' : ''}`}>
                            <div className="text-5xl font-bold text-white mb-2">
                                {eventsCounter.count}+
                            </div>
                            <div className="text-white/70">งานประชุมที่จัด</div>
                        </div>
                        <div className={`scroll-animate fade-up stagger-4 ${isVisible ? 'is-visible' : ''}`}>
                            <div className="text-5xl font-bold text-white mb-2">
                                {(cpeCounter.count / 1000).toFixed(0)}K+
                            </div>
                            <div className="text-white/70">หน่วยกิต CPE ที่ให้</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
