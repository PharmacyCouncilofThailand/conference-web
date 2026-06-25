'use client';

import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';

export function CTASection() {
    const { ref, isVisible } = useScrollAnimation();

    return (
        <section ref={ref} className="ui-section">
            <div className="ui-shell text-center">
                <h2 className={`ui-section-title font-bold mb-4 text-[#737300] scroll-animate fade-up ${isVisible ? 'is-visible' : ''}`}>
                    พร้อมเข้าร่วมงานประชุมหรือยัง?
                </h2>
                <p className={`text-gray-500 mb-8 max-w-xl mx-auto scroll-animate fade-up stagger-1 ${isVisible ? 'is-visible' : ''}`}>
                    ลงทะเบียนเข้าร่วมงานประชุมวิชาการเพื่อพัฒนาความรู้และสะสมหน่วยกิต CPE
                </p>
                <div className={`ui-cta-actions justify-center scroll-animate fade-up stagger-2 ${isVisible ? 'is-visible' : ''}`}>
                    <Link href="/events">
                        <Button
                            size="lg"
                            className="h-14 px-10 bg-[#8a8a00] hover:bg-[#456339] text-white rounded-xl transition-transform hover:scale-105 active:scale-95"
                        >
                            <Calendar className="w-5 h-5 mr-2" />
                            ดูงานประชุมทั้งหมด
                        </Button>
                    </Link>
                    <Link href="/login">
                        <Button size="lg" variant="outline" className="h-14 px-10 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50 transition-transform hover:scale-105 active:scale-95">
                            เข้าสู่ระบบสมาชิก
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
