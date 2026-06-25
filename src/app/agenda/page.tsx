'use client';

import { useCallback, useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ApiSession, ApiSpeaker } from '@/lib/api';
import { getEvents, getEventById } from '@/lib/services';
import { Calendar, Clock, MapPin, User, ChevronRight, AlertCircle, Layers, FileText } from 'lucide-react';
import { format, parseISO, isSameDay, compareAsc } from 'date-fns';
import { th } from 'date-fns/locale';
import { Event } from '@/types';

interface DayTab {
    date: Date;
    label: string;
    sessionCount: number;
}

export default function AgendaPage() {
    const [loading, setLoading] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [activeDay, setActiveDay] = useState<Date | null>(null);
    const [days, setDays] = useState<DayTab[]>([]);
    const [sessions, setSessions] = useState<ApiSession[]>([]);
    const [speakers, setSpeakers] = useState<ApiSpeaker[]>([]);
    const [error, setError] = useState('');

    const selectEvent = useCallback(async (eventId: string) => {
        try {
            setLoadingDetail(true);
            setSelectedEventId(eventId);
            const eventData = await getEventById(eventId);
            const eventSessions = (eventData.sessions || []) as unknown as ApiSession[];
            const eventSpeakers = (eventData.speakers || []) as unknown as ApiSpeaker[];
            if (eventData) {
                setSelectedEvent(eventData);
                setSessions(eventSessions);
                setSpeakers(eventSpeakers);

                // Generate day tabs from session dates
                const sessionDates = eventSessions
                    .map((session) => {
                        try { return parseISO(session.startTime); } catch { return null; }
                    })
                    .filter((date): date is Date => date !== null);

                const uniqueDates = (sessionDates as Date[]).reduce<Date[]>((acc, date) => {
                    if (!acc.some(d => isSameDay(d, date))) acc.push(date);
                    return acc;
                }, []);
                uniqueDates.sort((a, b) => compareAsc(a, b));

                const dayTabs: DayTab[] = uniqueDates.map(date => ({
                    date,
                    label: format(date, 'd MMM yyyy', { locale: th }),
                    sessionCount: eventSessions.filter((session) => {
                        try { return isSameDay(parseISO(session.startTime), date); } catch { return false; }
                    }).length
                }));

                if (dayTabs.length === 0) {
                    const start = new Date(eventData.startDate);
                    dayTabs.push({ date: start, label: format(start, 'd MMM yyyy', { locale: th }), sessionCount: 0 });
                }

                setDays(dayTabs);
                setActiveDay(dayTabs[0]?.date);
            }
        } catch (err) {
            console.error('Failed to fetch event details:', err);
        } finally {
            setLoadingDetail(false);
        }
    }, []);

    const fetchInitialData = useCallback(async () => {
        try {
            setLoading(true);
            const allEvents = await getEvents();
            const publishedEvents = allEvents
                .filter((event) => event.status === 'published' || !event.status)
                .sort((a, b) => new Date(b.startDate || '').getTime() - new Date(a.startDate || '').getTime());

            if (publishedEvents.length === 0) {
                setError('ไม่พบงานประชุมในขณะนี้');
                setLoading(false);
                return;
            }

            setEvents(publishedEvents);
            // Auto-select the first event
            await selectEvent(publishedEvents[0].id);
        } catch (err) {
            console.error('Failed to fetch agenda data:', err);
            setError('ไม่สามารถโหลดข้อมมูลได้ กรุณาลองใหม่อีกครั้ง');
        } finally {
            setLoading(false);
        }
    }, [selectEvent]);

    useEffect(() => {
        void fetchInitialData();
    }, [fetchInitialData]);

    const getFilteredSessions = () => {
        if (!activeDay || !sessions) return [];
        return sessions
            .filter(session => {
                try { return isSameDay(parseISO(session.startTime), activeDay); } catch { return false; }
            })
            .sort((a, b) => compareAsc(parseISO(a.startTime), parseISO(b.startTime)));
    };

    const getSpeakerNames = (speakerIdsStr: string | null) => {
        if (!speakerIdsStr) return [];
        try {
            if (speakerIdsStr.startsWith('[')) {
                const ids = JSON.parse(speakerIdsStr);
                if (Array.isArray(ids)) {
                    return ids.map(id => speakers.find(s => s.id === id)).filter(Boolean) as ApiSpeaker[];
                }
            }
            return [{ id: 0, name: speakerIdsStr, imageUrl: null, title: null, organization: null, bio: null, role: null }];
        } catch {
            return [{ id: 0, name: speakerIdsStr, imageUrl: null, title: null, organization: null, bio: null, role: null }];
        }
    };

    // Group sessions by time block for a nicer timeline
    const groupSessionsByTime = (sessionsList: ApiSession[]) => {
        const groups: { time: string; endTime: string; sessions: ApiSession[] }[] = [];
        for (const session of sessionsList) {
            const timeKey = format(parseISO(session.startTime), 'h:mm aa');
            const endKey = format(parseISO(session.endTime), 'h:mm aa');
            const existing = groups.find(g => g.time === timeKey);
            if (existing) {
                existing.sessions.push(session);
            } else {
                groups.push({ time: timeKey, endTime: endKey, sessions: [session] });
            }
        }
        return groups;
    };

    const filteredSessions = getFilteredSessions();
    const groupedSessions = groupSessionsByTime(filteredSessions);

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Navbar />

            {/* Header */}
            <div className="ui-page-hero bg-gradient-to-br from-[#8a8a00] via-[#456339] to-[#3a5530] relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
                <div className="ui-shell relative z-10">
                    <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-white/15 border border-white/25 text-white/90 text-sm font-medium mb-4">
                        <Layers className="w-4 h-4" />
                        Conference Agenda
                    </span>
                    <h1 className="ui-page-title font-bold mb-3 text-white">
                        กำหนดการประชุม
                    </h1>
                    <p className="ui-subtitle text-white/70 max-w-xl">
                        เลือกงานประชุมเพื่อดูตารางกิจกรรมและหัวข้อการบรรยาย
                    </p>
                </div>
            </div>

            <div className="ui-shell ui-section-tight">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="w-10 h-10 border-3 border-[#8a8a00] border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-400 text-sm">กำลังโหลดข้อมูล...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-24">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mb-5">
                            <AlertCircle className="w-7 h-7 text-red-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h3>
                        <p className="text-gray-500 mb-5 text-sm">{error}</p>
                        <button
                            onClick={fetchInitialData}
                            className="px-5 py-2 bg-[#8a8a00] hover:bg-[#456339] text-white rounded-lg transition-colors text-sm"
                        >
                            ลองใหม่อีกครั้ง
                        </button>
                    </div>
                ) : (
                    <div className="ui-agenda-layout">
                        {/* ========== LEFT SIDEBAR: Event Tabs ========== */}
                        <div className="flex-shrink-0">
                            <div className="ui-sticky-panel space-y-3">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">
                                    งานประชุมทั้งหมด ({events.length})
                                </h3>
                                <div className="space-y-2">
                                    {events.map((event) => {
                                        const isSelected = selectedEventId === event.id;
                                        return (
                                            <button
                                                key={event.id}
                                                onClick={() => selectEvent(event.id)}
                                                className={`w-full text-left rounded-xl p-4 transition-all duration-200 border group ${isSelected
                                                    ? 'bg-white border-[#8a8a00]/30 shadow-md shadow-[#8a8a00]/10 ring-1 ring-[#8a8a00]/20'
                                                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {/* Event image thumbnail */}
                                                    <div className={`w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden border ${isSelected ? 'border-[#8a8a00]/30' : 'border-gray-200'}`}>
                                                        {event.imageUrl ? (
                                                            <img src={event.imageUrl} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className={`w-full h-full flex items-center justify-center ${isSelected ? 'bg-[#8a8a00]/10' : 'bg-gray-100'}`}>
                                                                <Calendar className={`w-5 h-5 ${isSelected ? 'text-[#8a8a00]' : 'text-gray-400'}`} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className={`text-sm font-semibold truncate mb-1 ${isSelected ? 'text-[#8a8a00]' : 'text-gray-800'}`}>
                                                            {event.name || event.title || 'Untitled Event'}
                                                        </h4>
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                            <Calendar className="w-3 h-3" />
                                                            <span>{event.startDate ? format(new Date(event.startDate), 'd MMM yyyy', { locale: th }) : 'TBA'}</span>
                                                        </div>
                                                        {event.venue && (
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                                                                <MapPin className="w-3 h-3" />
                                                                <span className="truncate">{event.venue}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {isSelected && (
                                                        <ChevronRight className="w-4 h-4 text-[#8a8a00] flex-shrink-0 mt-1" />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* ========== RIGHT CONTENT: Schedule ========== */}
                        <div className="flex-1 min-w-0">
                            {loadingDetail ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="w-8 h-8 border-3 border-[#8a8a00] border-t-transparent rounded-full animate-spin mb-3"></div>
                                    <p className="text-gray-400 text-sm">กำลังโหลดกำหนดการ...</p>
                                </div>
                            ) : !selectedEvent ? (
                                <div className="text-center py-20">
                                    <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-400">เลือกงานประชุมจากด้านซ้ายเพื่อดูกำหนดการ</p>
                                </div>
                            ) : (
                                <div>
                                    {/* Event Title Bar */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">
                                                    {selectedEvent.name || selectedEvent.title}
                                                </h2>
                                                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                                                    {selectedEvent.startDate && (
                                                        <span className="flex items-center gap-1.5">
                                                            <Calendar className="w-4 h-4 text-[#8a8a00]" />
                                                            {format(new Date(selectedEvent.startDate), 'd MMM yyyy', { locale: th })}
                                                            {selectedEvent.endDate && ` - ${format(new Date(selectedEvent.endDate), 'd MMM yyyy', { locale: th })}`}
                                                        </span>
                                                    )}
                                                    {selectedEvent.venue && (
                                                        <span className="flex items-center gap-1.5">
                                                            <MapPin className="w-4 h-4 text-[#8a8a00]" />
                                                            {selectedEvent.venue}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="px-3 py-1 rounded-full bg-[#8a8a00]/10 text-[#8a8a00] font-medium">
                                                    {sessions.length} Sessions
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Day Tabs */}
                                    {days.length > 1 && (
                                        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                                            {days.map((day) => {
                                                const isActive = activeDay && isSameDay(activeDay, day.date);
                                                return (
                                                    <button
                                                        key={day.date.toISOString()}
                                                        onClick={() => setActiveDay(day.date)}
                                                        className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                                            ? 'bg-[#8a8a00] text-white shadow-md shadow-[#8a8a00]/20'
                                                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                                            }`}
                                                    >
                                                        <span>{day.label}</span>
                                                        <span className={`ml-2 text-xs ${isActive ? 'text-white/70' : 'text-gray-400'}`}>
                                                            ({day.sessionCount})
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Active Day Header */}
                                    {activeDay && (
                                        <div className="flex items-center gap-2 mb-5">
                                            <Clock className="w-5 h-5 text-[#8a8a00]" />
                                            <h3 className="text-lg font-semibold text-gray-800">
                                                {format(activeDay, 'EEEE d MMMM yyyy', { locale: th })}
                                            </h3>
                                        </div>
                                    )}

                                    {/* Timeline */}
                                    {groupedSessions.length > 0 ? (
                                        <div className="relative">
                                            {/* Timeline line */}
                                            <div className="absolute left-[39px] top-2 bottom-2 w-px bg-gradient-to-b from-[#8a8a00]/30 via-[#8a8a00]/15 to-transparent hidden sm:block"></div>

                                            <div className="space-y-4">
                                                {groupedSessions.map((group, gIdx) => (
                                                    <div key={gIdx} className="flex gap-4 sm:gap-6">
                                                        {/* Time Column */}
                                                        <div className="flex-shrink-0 w-[80px] pt-5 hidden sm:block">
                                                            <div className="relative">
                                                                {/* Timeline dot */}
                                                                <div className="absolute -right-[25px] top-1 w-3 h-3 rounded-full bg-[#8a8a00] border-2 border-white shadow-sm z-10"></div>
                                                                <div className="text-right pr-4">
                                                                    <div className="text-lg font-bold text-[#8a8a00]">{group.time}</div>
                                                                    <div className="text-xs text-gray-400">ถึง {group.endTime}</div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Session Cards */}
                                                        <div className="flex-1 min-w-0 space-y-3">
                                                            {group.sessions.map((session) => {
                                                                const sessionSpeakers = getSpeakerNames(session.speakers);
                                                                return (
                                                                    <div
                                                                        key={session.id}
                                                                        className="bg-white border border-gray-200 rounded-xl p-5 hover:border-[#8a8a00]/25 hover:shadow-sm transition-all group"
                                                                    >
                                                                        {/* Mobile time */}
                                                                        <div className="sm:hidden flex items-center gap-2 text-sm text-[#8a8a00] font-semibold mb-3">
                                                                            <Clock className="w-4 h-4" />
                                                                            {group.time} - {group.endTime}
                                                                        </div>

                                                                        {/* Code + Room badges */}
                                                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                                                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#8a8a00]/10 text-[#8a8a00] border border-[#8a8a00]/15">
                                                                                {session.sessionCode}
                                                                            </span>
                                                                            {session.room && (
                                                                                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                                                                                    <MapPin className="w-3 h-3" />
                                                                                    {session.room}
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        {/* Title */}
                                                                        <h4 className="text-base font-semibold text-gray-900 group-hover:text-[#8a8a00] transition-colors mb-1">
                                                                            {session.sessionName}
                                                                        </h4>

                                                                        {/* Description */}
                                                                        {session.description && (
                                                                            <p className="text-sm text-gray-500 leading-relaxed mb-3 line-clamp-2">
                                                                                {session.description}
                                                                            </p>
                                                                        )}

                                                                        {/* Speakers */}
                                                                        {sessionSpeakers.length > 0 && (
                                                                            <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-100">
                                                                                {sessionSpeakers.map((speaker, idx) => (
                                                                                    <div key={idx} className="flex items-center gap-2">
                                                                                        {speaker.imageUrl ? (
                                                                                            <img
                                                                                                src={speaker.imageUrl}
                                                                                                alt={speaker.name}
                                                                                                className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                                                                            />
                                                                                        ) : (
                                                                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                                                                <User className="w-4 h-4 text-gray-400" />
                                                                                            </div>
                                                                                        )}
                                                                                        <div>
                                                                                            <div className="text-sm font-medium text-gray-700">{speaker.name}</div>
                                                                                            {speaker.title && (
                                                                                                <div className="text-xs text-gray-400">{speaker.title}</div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
                                            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-400 text-sm">ยังไม่มีรายการในวันนี้</p>
                                            <p className="text-gray-300 text-xs mt-1">Session จะแสดงเมื่อมีการเพิ่มข้อมูลจากผู้ดูแลระบบ</p>
                                        </div>
                                    )}

                                    {/* Event Documents */}
                                    {selectedEvent.documents && selectedEvent.documents.length > 0 && (
                                        <div className="mt-8 bg-white border border-gray-200 rounded-xl p-5">
                                            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-[#8a8a00]" />
                                                เอกสารประกอบ
                                            </h3>
                                            <div className="ui-form-grid">
                                                {selectedEvent.documents.map((doc, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={doc.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-[#8a8a00]/5 hover:border-[#8a8a00]/20 transition-all group"
                                                    >
                                                        <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 group-hover:text-[#8a8a00] group-hover:border-[#8a8a00]/30 shadow-sm transition-colors flex-shrink-0">
                                                            <FileText className="w-4 h-4" />
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-600 group-hover:text-gray-800 truncate">
                                                            {doc.name}
                                                        </span>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}
