'use client';

import { useState, useMemo, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { getEvents } from '@/lib/services';
import { useQuery } from '@tanstack/react-query';
import { Calendar, MapPin, Clock, ArrowRight, Search, X, Award } from 'lucide-react';
import Link from 'next/link';
import { Event } from '@/types';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';

const ITEMS_PER_PAGE = 4;

export default function EventsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [mounted, setMounted] = useState(false);

    const { ref: eventsRef, isVisible: eventsVisible } = useScrollAnimation({ rootMargin: '0px 0px -20px 0px' });

    useEffect(() => {
        requestAnimationFrame(() => setMounted(true));
    }, []);

    const { data: events, isLoading } = useQuery({
        queryKey: ['events'],
        queryFn: getEvents,
    });

    // Get unique categories
    const categories = useMemo(() => {
        if (!events) return [];
        const cats = events.map((e: Event) => e.category).filter((c): c is string => !!c);
        return ['all', ...Array.from(new Set(cats))];
    }, [events]);

    // Filter events based on search and category
    const filteredEvents = useMemo(() => {
        if (!events) return [];
        return events.filter((event: Event) => {
            const searchLower = searchQuery.toLowerCase();
            const eventTitle = event.title || event.name || '';
            const eventDesc = event.description || '';

            const matchesSearch =
                eventTitle.toLowerCase().includes(searchLower) ||
                eventDesc.toLowerCase().includes(searchLower) ||
                event.rounds?.some((r) => r.location?.toLowerCase().includes(searchLower));

            const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });
    }, [events, searchQuery, selectedCategory]);

    // Pagination
    const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
    const paginatedEvents = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredEvents, currentPage]);

    const getEventImageUrl = (event: Event) => {
        const imageUrl = event.imageUrl?.trim();
        const coverImage = event.coverImage?.trim();
        return imageUrl || coverImage || null;
    };

    // Reset to page 1 when search or filter changes
    const handleSearch = (value: string) => {
        setSearchQuery(value);
        setCurrentPage(1);
    };

    const handleCategoryChange = (cat: string) => {
        setSelectedCategory(cat);
        setCurrentPage(1);
    };

    // Scroll to top when page changes
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 flex flex-col">
            <Navbar />

            {/* Header Section */}
            <section className="ui-page-hero bg-gradient-to-br from-[#8a8a00] via-[#456339] to-[#3d5733] overflow-hidden">
                {/* Animated background shapes */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
                    <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/3 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
                </div>

                <div className="ui-shell text-center relative z-10">
                    <h1 className={`ui-page-title font-bold mb-4 text-white scroll-animate fade-up ${mounted ? 'is-visible' : ''}`}>
                        ค้นหาการประชุม
                    </h1>
                    <div className={`flex justify-center items-center gap-2 text-white/60 text-sm font-medium uppercase tracking-wider scroll-animate fade-up stagger-1 ${mounted ? 'is-visible' : ''}`}>
                        <Link href="/" className="hover:text-white transition-colors">หน้าหลัก</Link>
                        <span>&gt;</span>
                        <span className="text-white">งานประชุม</span>
                    </div>
                </div>
            </section>

            {/* Search & Filter Section */}
            <section className={`ui-section-tight border-b border-gray-200 scroll-animate fade-up stagger-2 ${mounted ? 'is-visible' : ''}`}>
                <div className="ui-shell max-w-5xl">
                    <div className="ui-filter-layout">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="ค้นหาชื่อการประชุม, สถานที่..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full h-12 pl-12 pr-10 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8a8a00]/30 focus:border-[#8a8a00] transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => handleSearch('')}
                                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-700 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {/* Category Filter */}
                        <div className="flex gap-2 flex-wrap">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => handleCategoryChange(cat)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${selectedCategory === cat
                                        ? 'bg-[#8a8a00] text-white scale-105 shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 hover:scale-105'
                                        }`}
                                >
                                    {cat === 'all' ? 'ทั้งหมด' : cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Results count */}
                    <div className="mt-4 text-sm text-gray-500">
                        พบ <span className="text-[#8a8a00] font-bold">{filteredEvents.length}</span> รายการ
                        {searchQuery && <span className="ml-1">สำหรับ &quot;{searchQuery}&quot;</span>}
                    </div>
                </div>
            </section>

            {/* Event List Section */}
            <section className="ui-section flex-grow">
                <div className="ui-shell max-w-5xl">
                    <div ref={eventsRef} className={`mb-8 scroll-animate fade-up ${eventsVisible ? 'is-visible' : ''}`}>
                        <span className="text-[#8a8a00] font-bold text-sm tracking-wider uppercase mb-2 block">Event Schedule</span>
                        <h2 className="ui-section-title font-bold text-[#737300]">รายการการประชุม</h2>
                    </div>

                    <div className="space-y-6">
                        {isLoading ? (
                            // Skeleton loading with pulse animation
                            <div className="space-y-6">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="ui-event-list-card bg-white border border-gray-200 rounded-2xl">
                                        <div className="ui-event-list-layout">
                                            <div className="ui-event-list-media bg-gray-100 rounded-xl animate-pulse" />
                                            <div className="flex-1 space-y-4 w-full">
                                                <div className="h-4 bg-gray-100 rounded w-24 animate-pulse" />
                                                <div className="h-7 bg-gray-100 rounded w-3/4 animate-pulse" />
                                                <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
                                                <div className="flex gap-4">
                                                    <div className="h-8 bg-gray-100 rounded w-28 animate-pulse" />
                                                    <div className="h-8 bg-gray-100 rounded w-28 animate-pulse" />
                                                    <div className="h-8 bg-gray-100 rounded w-28 animate-pulse" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredEvents.length === 0 ? (
                            <div className="text-center py-20 scroll-animate fade-up is-visible">
                                <div className="text-gray-500 text-lg mb-2">ไม่พบการประชุมที่ค้นหา</div>
                                <button
                                    onClick={() => { handleSearch(''); handleCategoryChange('all'); }}
                                    className="text-[#8a8a00] hover:text-[#456339] transition-colors"
                                >
                                    ล้างการค้นหา
                                </button>
                            </div>
                        ) : paginatedEvents.map((event: Event, index: number) => (
                            <div
                                key={event.id}
                                className={`ui-event-list-card group bg-white border border-gray-200 rounded-2xl hover:border-[#8a8a00]/50 hover:shadow-xl transition-all duration-500 scroll-animate fade-up stagger-${index + 1} ${eventsVisible ? 'is-visible' : ''}`}
                                style={{ transitionProperty: 'border-color, box-shadow, transform' }}
                            >
                                <div className="ui-event-list-layout">
                                    {/* Thumbnail */}
                                    <div className="ui-event-list-media bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 relative">
                                        {getEventImageUrl(event) ? (
                                            <img src={getEventImageUrl(event)!} alt={event.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#8a8a00]/10 to-[#737300]/10 text-[#8a8a00]">
                                                <Calendar className="w-12 h-12 opacity-60" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold text-white border border-white/10">
                                            {event.eventType === 'single_room' ? 'Single Session' : 'Multi Sessions'}
                                        </div>
                                        {/* CPE Credits badge */}
                                        {event.cpeCredits && Number(event.cpeCredits) > 0 && (
                                            <div className="absolute top-3 right-3 bg-[#8a8a00]/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1 shadow-md">
                                                <Award className="w-3 h-3" />
                                                {event.cpeCredits} CPE
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="ui-event-list-content flex-1 space-y-4">
                                        <div>


                                            <h3 className="text-2xl font-bold mb-2 text-gray-900 group-hover:text-[#8a8a00] transition-colors duration-300">{event.name}</h3>
                                            <p className="text-gray-500 text-sm line-clamp-2 md:line-clamp-none">{event.description}</p>
                                        </div>

                                        <div className="flex flex-col gap-2 text-sm text-gray-600">
                                            {/* Row 1: Date + Time */}
                                            <div className="ui-event-meta-row items-center gap-3">
                                                <span className="inline-flex items-center gap-1.5 bg-[#8a8a00]/8 text-[#8a8a00] px-3 py-1.5 rounded-full font-medium text-xs">
                                                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                                                    {event.rounds?.[0]?.date
                                                        ? new Date(event.rounds[0].date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok' })
                                                        : (event.startDate ? new Date(event.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok' }) : 'TBA')}
                                                </span>
                                                {event.startDate && (
                                                    <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full text-xs">
                                                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                                                        {new Date(event.startDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' })} น.
                                                    </span>
                                                )}
                                            </div>
                                            {/* Row 2: Location */}
                                            {(event.rounds?.[0]?.location || event.location) && (
                                                <div className="ui-event-meta-row items-start gap-1.5 text-gray-500">
                                                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#8a8a00]" />
                                                    <span className="text-xs leading-relaxed line-clamp-2">{event.rounds?.[0]?.location || event.location}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <div className="ui-event-list-action flex-shrink-0">
                                        <Link href={`/events/${event.id}`}>
                                            <Button className="h-12 px-8 rounded-full bg-[#8a8a00] hover:bg-[#456339] text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95">
                                                ลงทะเบียน <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="ui-pagination-row items-center justify-center gap-2 mt-12">
                            {/* Previous Button */}
                            <button
                                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 rounded-lg bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-200 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                            >
                                ก่อนหน้า
                            </button>

                            {/* Page Numbers */}
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                    // Show first, last, current, and nearby pages
                                    if (
                                        page === 1 ||
                                        page === totalPages ||
                                        (page >= currentPage - 1 && page <= currentPage + 1)
                                    ) {
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`w-10 h-10 rounded-lg font-medium transition-all duration-200 ${currentPage === page
                                                    ? 'bg-[#8a8a00] text-white scale-110 shadow-md'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 hover:scale-105'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    } else if (
                                        page === currentPage - 2 ||
                                        page === currentPage + 2
                                    ) {
                                        return <span key={page} className="px-1 text-gray-400">...</span>;
                                    }
                                    return null;
                                })}
                            </div>

                            {/* Next Button */}
                            <button
                                onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 rounded-lg bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-200 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                            >
                                ถัดไป
                            </button>
                        </div>
                    )}

                    {/* Page Info */}
                    {filteredEvents.length > 0 && (
                        <div className="text-center mt-4 text-sm text-gray-500">
                            แสดง {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredEvents.length)} จาก {filteredEvents.length} รายการ
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}
