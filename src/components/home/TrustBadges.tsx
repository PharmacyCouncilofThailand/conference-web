'use client';

import { CheckCircle, Shield, Award, Star } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';

export function TrustBadges() {
    const { ref, isVisible } = useScrollAnimation();

    return (
        <section ref={ref} className="ui-section-tight border-y border-gray-200 bg-gray-50">
            <div className="ui-shell">
                <div className={`ui-trust-row scroll-animate fade-up ${isVisible ? 'is-visible' : ''}`}>
                    <div className="flex items-center gap-2 text-gray-600 transition-transform hover:scale-105">
                        <CheckCircle className="w-5 h-5 text-[#8a8a00]" />
                        <span className="text-sm">รับรองโดยสภาเภสัชกรรม</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 transition-transform hover:scale-105">
                        <Shield className="w-5 h-5 text-blue-500" />
                        <span className="text-sm">มาตรฐาน ISO 9001</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 transition-transform hover:scale-105">
                        <Award className="w-5 h-5 text-[#8a8a00]" />
                        <span className="text-sm">หน่วยกิต CPE ได้รับการรับรอง</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 transition-transform hover:scale-105">
                        <Star className="w-5 h-5 text-[#8a8a00]" />
                        <span className="text-sm">คะแนนความพึงพอใจ 4.8/5</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
