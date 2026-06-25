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
    const { count: yearsDisplayCount, setIsVisible: setYearsCounterVisible } = useCounter(yearsCount, 2000);
    const { count: membersDisplayCount, setIsVisible: setMembersCounterVisible } = useCounter(membersCount, 2500);
    const { count: eventsDisplayCount, setIsVisible: setEventsCounterVisible } = useCounter(eventsCount, 2000);
    const { count: cpeDisplayCount, setIsVisible: setCpeCounterVisible } = useCounter(cpeCount, 2500);

    const { ref, isVisible } = useScrollAnimation({ threshold: 0.3 });

    // Start counting when the section is visible
    useEffect(() => {
        if (isVisible) {
            setYearsCounterVisible(true);
            setMembersCounterVisible(true);
            setEventsCounterVisible(true);
            setCpeCounterVisible(true);
        }
    }, [
        isVisible,
        setCpeCounterVisible,
        setEventsCounterVisible,
        setMembersCounterVisible,
        setYearsCounterVisible,
    ]);

    return (
        <section ref={ref} className="ui-section">
            <div className="ui-shell">
                <div className={`ui-stats-panel bg-[#8a8a00] text-white scroll-animate scale-in ${isVisible ? 'is-visible' : ''}`}>
                    <div className="ui-stats-grid text-center">
                        <div className={`scroll-animate fade-up stagger-1 ${isVisible ? 'is-visible' : ''}`}>
                            <div className="ui-stats-number font-bold text-white mb-2">
                                {yearsDisplayCount}+
                            </div>
                            <div className="text-white/70">ปีแห่งประสบการณ์</div>
                        </div>
                        <div className={`scroll-animate fade-up stagger-2 ${isVisible ? 'is-visible' : ''}`}>
                            <div className="ui-stats-number font-bold text-white mb-2">
                                {(membersDisplayCount / 1000).toFixed(0)}K+
                            </div>
                            <div className="text-white/70">สมาชิกเภสัชกร</div>
                        </div>
                        <div className={`scroll-animate fade-up stagger-3 ${isVisible ? 'is-visible' : ''}`}>
                            <div className="ui-stats-number font-bold text-white mb-2">
                                {eventsDisplayCount}+
                            </div>
                            <div className="text-white/70">งานประชุมที่จัด</div>
                        </div>
                        <div className={`scroll-animate fade-up stagger-4 ${isVisible ? 'is-visible' : ''}`}>
                            <div className="ui-stats-number font-bold text-white mb-2">
                                {(cpeDisplayCount / 1000).toFixed(0)}K+
                            </div>
                            <div className="text-white/70">หน่วยกิต CPE ที่ให้</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
