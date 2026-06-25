'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Calendar, ArrowRight, MapPin, Award, ChevronRight, ChevronLeft, Shield } from 'lucide-react';
import Link from 'next/link';
import { useCounter } from '@/hooks/use-counter';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Event } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const CAROUSEL_INTERVAL = 5000;
const EMPTY_EVENTS: Event[] = [];

function formatEventDate(dateString?: string) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Bangkok'
    });
}

interface HeroSectionProps {
    yearsCount: number;
    membersCount: number;
    eventsCount: number;
    featuredEvent?: Event;
    events?: Event[];
}

export function HeroSection({ yearsCount, membersCount, eventsCount, featuredEvent, events = EMPTY_EVENTS }: HeroSectionProps) {
    const { count: yearsDisplayCount, setIsVisible: setYearsCounterVisible } = useCounter(yearsCount, 2000);
    const { count: membersDisplayCount, setIsVisible: setMembersCounterVisible } = useCounter(membersCount, 2500);
    const { count: eventsDisplayCount, setIsVisible: setEventsCounterVisible } = useCounter(eventsCount, 2000);
    const [mounted, setMounted] = useState(false);
    const { isLoggedIn } = useAuth();

    // Carousel state
    const carouselEvents = useMemo(() => {
        if (events.length > 0) return events;
        return featuredEvent ? [featuredEvent] : EMPTY_EVENTS;
    }, [events, featuredEvent]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const goToSlide = useCallback((index: number) => {
        if (index === currentIndex) return;
        setCurrentIndex(index);
    }, [currentIndex]);

    const goNext = useCallback(() => {
        if (carouselEvents.length <= 1) return;
        const next = (currentIndex + 1) % carouselEvents.length;
        goToSlide(next);
    }, [currentIndex, carouselEvents.length, goToSlide]);

    const goPrev = useCallback(() => {
        if (carouselEvents.length <= 1) return;
        const prev = (currentIndex - 1 + carouselEvents.length) % carouselEvents.length;
        goToSlide(prev);
    }, [currentIndex, carouselEvents.length, goToSlide]);

    // Auto-rotate
    useEffect(() => {
        if (carouselEvents.length <= 1 || isPaused) return;
        const timer = setInterval(goNext, CAROUSEL_INTERVAL);
        return () => clearInterval(timer);
    }, [carouselEvents.length, isPaused, goNext]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setYearsCounterVisible(true);
            setMembersCounterVisible(true);
            setEventsCounterVisible(true);
        }, 500);

        // Trigger entrance animation
        requestAnimationFrame(() => setMounted(true));

        return () => clearTimeout(timer);
    }, [setEventsCounterVisible, setMembersCounterVisible, setYearsCounterVisible]);

    const currentEvent = carouselEvents[currentIndex];

    return (
        <section className="ui-hero-section bg-white overflow-hidden">
            <div className="ui-shell">
                <div className="ui-home-hero-grid">
                    {/* Left Content */}
                    <div className="ui-hero-copy space-y-8">
                        {/* Official Badge */}
                        <div
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8a8a00]/10 border border-[#8a8a00]/20 scroll-animate fade-up ${mounted ? 'is-visible' : ''}`}
                        >
                            <Shield className="w-4 h-4 text-[#8a8a00]" />
                            <span className="text-sm text-[#8a8a00] font-medium">องค์กรวิชาชีพเภสัชกรรม</span>
                        </div>

                        <h1
                            className={`ui-hero-title font-bold text-[#737300] scroll-animate fade-up stagger-1 ${mounted ? 'is-visible' : ''}`}
                        >
                            สภาเภสัชกรรม
                            <br />
                            <span className="text-[#8a8a00]">
                                แห่งประเทศไทย
                            </span>
                        </h1>

                        <p
                            className={`ui-hero-description text-gray-500 scroll-animate fade-up stagger-2 ${mounted ? 'is-visible' : ''}`}
                        >
                            ศูนย์กลางการจัดงานประชุมวิชาการและอบรมเพื่อพัฒนาศักยภาพเภสัชกร
                            พร้อมสะสมหน่วยกิตการศึกษาต่อเนื่อง (CPE) ที่ได้รับการรับรอง
                        </p>

                        {/* CTA Buttons */}
                        <div className={`ui-action-row scroll-animate fade-up stagger-3 ${mounted ? 'is-visible' : ''}`}>
                            <Link href="/events">
                                <Button size="lg" className="h-14 px-8 bg-[#8a8a00] text-white hover:bg-[#456339] rounded-xl shadow-lg font-semibold transition-transform hover:scale-105 active:scale-95">
                                    <Calendar className="w-5 h-5 mr-2" />
                                    ดูงานประชุมทั้งหมด
                                </Button>
                            </Link>
                            {!isLoggedIn && (
                                <Link href="/login">
                                    <Button size="lg" variant="outline" className="h-14 px-8 rounded-xl border-[#8a8a00]/30 hover:bg-[#8a8a00]/5 text-[#8a8a00] transition-transform hover:scale-105 active:scale-95">
                                        เข้าสู่ระบบสมาชิก
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </Link>
                            )}
                        </div>

                        {/* Quick Stats */}
                        <div className={`ui-quick-stats pt-4 scroll-animate fade-up stagger-4 ${mounted ? 'is-visible' : ''}`}>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-[#8a8a00]">{yearsDisplayCount}+</div>
                                <div className="text-sm text-gray-500">ปีแห่งความไว้วางใจ</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-[#8a8a00]">{(membersDisplayCount / 1000).toFixed(0)}K+</div>
                                <div className="text-sm text-gray-500">เภสัชกรทั่วประเทศ</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-[#8a8a00]">{eventsDisplayCount}+</div>
                                <div className="text-sm text-gray-500">งานประชุมที่จัด</div>
                            </div>
                        </div>
                    </div>

                    {/* Right - Event Carousel */}
                    <div
                        className={`relative scroll-animate slide-right stagger-2 ${mounted ? 'is-visible' : ''}`}
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                    >
                        {currentEvent ? (
                            <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-xl w-full aspect-[4/3]">
                                {/* Carousel slides */}
                                {carouselEvents.map((event, index) => (
                                    <div
                                        key={event.id}
                                        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                                    >
                                        <Image
                                            src={event.imageUrl || event.coverImage || event.image || 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop'}
                                            alt={event.name || 'Conference'}
                                            fill
                                            className="object-cover"
                                            priority={index === 0}
                                            sizes="(max-width: 1024px) 100vw, 50vw"
                                        />
                                    </div>
                                ))}

                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20" />

                                {/* Prev / Next arrows */}
                                {carouselEvents.length > 1 && (
                                    <>
                                        <button
                                            onClick={goPrev}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                                            aria-label="Previous event"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={goNext}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                                            aria-label="Next event"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </>
                                )}

                                {/* Event Info Overlay */}
                                <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#8a8a00] rounded-full text-sm font-medium text-white mb-3">
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                        เปิดรับสมัครแล้ว
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2 text-white">{currentEvent.name}</h3>
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-300 mb-4">
                                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatEventDate(currentEvent.startDate)}</span>
                                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {currentEvent.location || 'สถานที่จัดงาน'}</span>
                                        {currentEvent.cpeCredits && Number(currentEvent.cpeCredits) > 0 && (
                                            <span className="flex items-center gap-1"><Award className="w-4 h-4 text-white/80" /> {currentEvent.cpeCredits} หน่วยกิต CPE</span>
                                        )}
                                    </div>
                                    <Link href={`/events/${currentEvent.id}`}>
                                        <Button className="w-full bg-white text-[#8a8a00] hover:bg-gray-100 rounded-xl font-semibold transition-transform hover:scale-[1.02] active:scale-95">
                                            ลงทะเบียนเข้าร่วม
                                            <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </Link>
                                </div>

                                {/* Dot indicators */}
                                {carouselEvents.length > 1 && (
                                    <div className="absolute top-4 left-0 right-0 z-30 flex justify-center gap-2">
                                        {carouselEvents.map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() => goToSlide(index)}
                                                className={`h-1.5 rounded-full transition-all duration-300 ${index === currentIndex ? 'bg-white w-8' : 'bg-white/50 w-4 hover:bg-white/70'}`}
                                                aria-label={`Go to event ${index + 1}`}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Progress bar */}
                                {carouselEvents.length > 1 && !isPaused && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-30">
                                        <div
                                            key={currentIndex}
                                            className="h-full bg-[#8a8a00] rounded-r-full"
                                            style={{ animation: `carousel-progress ${CAROUSEL_INTERVAL}ms linear` }}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-xl">
                                <div className="w-full aspect-[4/3] bg-gray-100 flex items-center justify-center">
                                    <Calendar className="w-16 h-16 text-gray-300" />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-6">
                                    <h3 className="text-xl font-bold mb-2 text-white/60">กำลังโหลดข้อมูลงาน...</h3>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </section>
    );
}
