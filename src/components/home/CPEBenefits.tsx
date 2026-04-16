'use client';

import { GraduationCap, BookOpen, Users } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';

export function CPEBenefits() {
    const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
    const { ref: cardsRef, isVisible: cardsVisible } = useScrollAnimation({ rootMargin: '0px 0px -30px 0px' });

    return (
        <section className="py-20 px-6 bg-gray-50">
            <div className="container mx-auto">
                <div ref={headerRef} className={`text-center mb-16 scroll-animate fade-up ${headerVisible ? 'is-visible' : ''}`}>
                    <span className="text-[#8a8a00] text-sm font-bold uppercase tracking-wider">
                        หน่วยกิตการศึกษาต่อเนื่อง
                    </span>
                    <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 text-[#737300]">ทำไมต้องสะสม CPE?</h2>
                    <p className="text-gray-500 max-w-2xl mx-auto">
                        หน่วยกิตการศึกษาต่อเนื่องทางเภสัชศาสตร์ (CPE) เป็นสิ่งจำเป็นสำหรับการต่ออายุใบอนุญาตประกอบวิชาชีพเภสัชกรรม
                    </p>
                </div>

                <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className={`text-center p-8 bg-white rounded-2xl border border-gray-200 shadow-sm transition-all hover:-translate-y-2 hover:shadow-lg scroll-animate fade-up stagger-1 ${cardsVisible ? 'is-visible' : ''}`}>
                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#8a8a00]/10 flex items-center justify-center transition-transform hover:scale-110 hover:rotate-3">
                            <GraduationCap className="w-8 h-8 text-[#8a8a00]" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-[#737300]">พัฒนาความรู้</h3>
                        <p className="text-gray-500 text-sm">
                            อัปเดตความรู้ใหม่ๆ ในวงการเภสัชกรรม จากวิทยากรผู้เชี่ยวชาญ
                        </p>
                    </div>

                    <div className={`text-center p-8 bg-white rounded-2xl border border-gray-200 shadow-sm transition-all hover:-translate-y-2 hover:shadow-lg scroll-animate fade-up stagger-2 ${cardsVisible ? 'is-visible' : ''}`}>
                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-blue-50 flex items-center justify-center transition-transform hover:scale-110 hover:rotate-3">
                            <BookOpen className="w-8 h-8 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-[#737300]">ต่ออายุใบอนุญาต</h3>
                        <p className="text-gray-500 text-sm">
                            สะสมหน่วยกิตครบตามเกณฑ์สำหรับการต่ออายุใบประกอบวิชาชีพ
                        </p>
                    </div>

                    <div className={`text-center p-8 bg-white rounded-2xl border border-gray-200 shadow-sm transition-all hover:-translate-y-2 hover:shadow-lg scroll-animate fade-up stagger-3 ${cardsVisible ? 'is-visible' : ''}`}>
                        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#8a8a00]/10 flex items-center justify-center transition-transform hover:scale-110 hover:rotate-3">
                            <Users className="w-8 h-8 text-[#8a8a00]" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-[#737300]">เครือข่ายวิชาชีพ</h3>
                        <p className="text-gray-500 text-sm">
                            พบปะแลกเปลี่ยนประสบการณ์กับเภสัชกรจากทั่วประเทศ
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
