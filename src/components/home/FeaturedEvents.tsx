'use client';

import Link from 'next/link';
import { Calendar, MapPin, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Event } from '@/types';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';
import { useRef, useState, useEffect, useCallback } from 'react';

interface FeaturedEventsProps {
    events: Event[];
}

const PLACEHOLDER_CARDS = [1, 2, 3];
const FALLBACK_EVENT_IMAGE = 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?q=80&w=800&auto=format&fit=crop';

export function FeaturedEvents({ events }: FeaturedEventsProps) {
    const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
    const { ref: cardsRef, isVisible: cardsVisible } = useScrollAnimation({ rootMargin: '0px 0px -30px 0px' });
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    }, []);

    useEffect(() => {
        checkScroll();
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener('scroll', checkScroll, { passive: true });
        window.addEventListener('resize', checkScroll);
        return () => {
            el.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
        };
    }, [checkScroll, events.length]);

    const scroll = useCallback((direction: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) return;
        const cardWidth = el.querySelector<HTMLElement>(':scope > a, :scope > div')?.offsetWidth || 360;
        const styles = window.getComputedStyle(el);
        const gap = Number.parseFloat(styles.columnGap || styles.gap || '0') || 0;
        el.scrollBy({ left: direction === 'left' ? -(cardWidth + gap) : (cardWidth + gap), behavior: 'smooth' });
    }, []);

    return (
        <section className="ui-section">
            <div className="ui-shell">
                <div
                    ref={headerRef}
                    className={`ui-featured-header scroll-animate fade-up ${headerVisible ? 'is-visible' : ''}`}
                >
                    <div>
                        <span className="text-[#8a8a00] text-sm font-bold uppercase tracking-wider">งานที่กำลังจะมาถึง</span>
                        <h2 className="ui-section-title font-bold mt-2 text-[#737300]">งานประชุมวิชาการ</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        {events.length > 0 && (
                            <div className="hidden md:flex items-center gap-2">
                                <button
                                    onClick={() => scroll('left')}
                                    disabled={!canScrollLeft}
                                    className="p-2 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    aria-label="Scroll left"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => scroll('right')}
                                    disabled={!canScrollRight}
                                    className="p-2 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    aria-label="Scroll right"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                        <Link href="/events">
                            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 transition-transform hover:scale-105">
                                ดูทั้งหมด <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="relative" ref={cardsRef}>
                    <div
                        ref={scrollRef}
                        className="ui-featured-track"
                    >
                        {events.length > 0 ? (
                            events.map((event, index) => (
                                <Link
                                    href={`/events/${event.id}`}
                                    key={event.id}
                                    className="ui-featured-card-link"
                                >
                                    <div
                                        className={`group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-[#8a8a00]/50 transition-all hover:-translate-y-2 shadow-sm hover:shadow-xl h-full scroll-animate fade-up stagger-${index + 1} ${cardsVisible ? 'is-visible' : ''}`}
                                    >
                                        <div className="aspect-video relative overflow-hidden">
                                            <img
                                                src={
                                                    event.imageUrl ||
                                                    event.coverImage ||
                                                    event.image ||
                                                    FALLBACK_EVENT_IMAGE
                                                }
                                                alt={event.name || event.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                            {event.cpeCredits && Number(event.cpeCredits) > 0 && (
                                                <div className="absolute top-3 right-3 bg-[#8a8a00] text-white px-3 py-1 rounded-full text-sm font-medium shadow-md">
                                                    {event.cpeCredits} CPE
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-5">
                                            <h3 className="text-lg font-bold mb-2 text-[#737300] group-hover:text-[#8a8a00] transition-colors line-clamp-2">
                                                {event.name || event.title}
                                            </h3>
                                            <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {new Date(event.startDate || event.date || '').toLocaleDateString('th-TH', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        timeZone: 'Asia/Bangkok',
                                                    })}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-4 h-4" />
                                                    {event.venue || event.location || 'TBA'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            // Placeholder cards
                            PLACEHOLDER_CARDS.map((i) => (
                                <div key={i} className="ui-featured-card-link bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                    <div className="aspect-video bg-gray-100 animate-pulse" />
                                    <div className="p-5 space-y-3">
                                        <div className="h-6 bg-gray-100 rounded animate-pulse" />
                                        <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
