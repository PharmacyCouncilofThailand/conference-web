'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getEventById } from '@/lib/services';
import { registrationsApi } from '@/lib/api/registrations';
import { hasApprovedPostgraduateEligibility, studentEligibilityApi } from '@/lib/api/studentEligibility';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import {
    Calendar, MapPin, User, Mail, CheckCircle,
    Loader2, AlertCircle, Ticket, ArrowLeft, Copy, ExternalLink, GraduationCap
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import type { ApiError } from '@/lib/api/client';
import { formatStudentLevelList, getEffectiveTicketIdentity, getStudentLevelLabel, ticketAllowsUser } from '@/lib/utils';

type RegistrationResult = {
    regCode: string;
    eventName: string;
    ticketName: string;
};

export default function FreeRegisterPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const eventId = params.eventId as string;

    const { user: authUser, isLoggedIn } = useAuth();
    const userRole = authUser?.role || 'public';

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string>('');
    const [result, setResult] = useState<RegistrationResult | null>(null);
    const [copied, setCopied] = useState(false);
    const [countdown, setCountdown] = useState(10);

    const originApp = searchParams.get('originApp')
        || (typeof window !== 'undefined' ? sessionStorage.getItem('sso-origin-app') : null);
    const returnTo = searchParams.get('returnTo');
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    const { data: event, isLoading, isError } = useQuery({
        queryKey: ['event', eventId],
        queryFn: () => getEventById(eventId),
        enabled: !!eventId,
    });

    const shouldCheckStudentEligibility = isLoggedIn && userRole === 'pharmacist' && !!event?.code;
    const { data: studentEligibilityData, isLoading: eligibilityLoading } = useQuery({
        queryKey: ['student-eligibility', event?.code, authUser?.id],
        queryFn: () => studentEligibilityApi.getMe(event!.code),
        enabled: shouldCheckStudentEligibility,
        retry: 1,
    });

    // Determine the "back to website" URL: prefer event.websiteUrl, fallback to returnTo
    const backToWebsiteUrl = event?.websiteUrl || returnTo || null;
    const isSsoUser = !!originApp;

    // SSO auto-redirect countdown: 10s after registration success
    useEffect(() => {
        if (!result || !isSsoUser || !backToWebsiteUrl) return;

        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    if (countdownRef.current) clearInterval(countdownRef.current);
                    window.location.href = backToWebsiteUrl;
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, [result, isSsoUser, backToWebsiteUrl]);

    const userStudentLevel = authUser?.studentLevel || null;
    const effectiveTicketIdentity = useMemo(() => getEffectiveTicketIdentity(
        userRole,
        userStudentLevel,
        hasApprovedPostgraduateEligibility(studentEligibilityData?.eligibility),
    ), [studentEligibilityData?.eligibility, userRole, userStudentLevel]);
    const displayStudentLevel = effectiveTicketIdentity.role === 'student'
        ? effectiveTicketIdentity.studentLevel
        : userStudentLevel;

    // Determine the packageId based on user role (same logic as event detail page)
    // packageId maps directly to role for ticket matching
    const packageId = useMemo(() => {
        const roleToPackage: Record<string, string> = {
            pharmacist: 'pharmacist',
            medical_professional: 'medical_professional',
            student: 'student',
            general: 'general',
        };
        return roleToPackage[effectiveTicketIdentity.role] || 'pharmacist';
    }, [effectiveTicketIdentity.role]);

    // Find the auto-selected free ticket for this user
    const freeTicket = useMemo(() => {
        if (!event?.ticketTypes) return null;

        const isTicketAllowedForUser = (ticket: { allowedRoles?: string[]; allowedStudentLevels?: string[] }) =>
            ticketAllowsUser(ticket, effectiveTicketIdentity.role, effectiveTicketIdentity.studentLevel);

        const isTicketOnSale = (ticket: { salesStart?: string; salesEnd?: string }) => {
            const now = new Date();
            const saleStart = ticket.salesStart ? new Date(ticket.salesStart) : null;
            const saleEnd = ticket.salesEnd ? new Date(ticket.salesEnd) : null;
            if (saleStart && now < saleStart) return false;
            if (saleEnd && now > saleEnd) return false;
            return true;
        };

        const primaryTickets = event.ticketTypes.filter(
            t => t.ticketCategory !== 'addon' && isTicketAllowedForUser(t) && isTicketOnSale(t)
        );

        // Find first free ticket (price = 0)
        return primaryTickets.find(t => Number(t.price) === 0) || null;
    }, [effectiveTicketIdentity.role, effectiveTicketIdentity.studentLevel, event]);

    const handleRegister = async () => {
        if (!isLoggedIn || !authUser) {
            const loginUrl = `/login?redirect=${encodeURIComponent(`/register/${eventId}`)}`;
            window.location.href = loginUrl;
            return;
        }

        setError('');
        setIsSubmitting(true);

        try {
            const response = await registrationsApi.freeRegister({
                eventId: Number(eventId),
                packageId,
            });

            setResult(response.data);
        } catch (err) {
            const apiErr = err as ApiError;
            if (apiErr.code === 'ALREADY_REGISTERED') {
                setError('คุณได้ลงทะเบียนงานนี้แล้ว');
            } else if (apiErr.code === 'STUDENT_ELIGIBILITY_REQUIRED') {
                setError('Postgraduate student-rate registration requires approved eligibility for this event. Please submit or review your document from Profile before registering.');
            } else {
                setError(apiErr.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopyRegCode = () => {
        if (result?.regCode) {
            navigator.clipboard.writeText(result.regCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const pharmacistEligibilityStatus = studentEligibilityData?.eligibility?.status;
    const hasPostgraduateStudentFreeTicket = event?.ticketTypes?.some(ticket =>
        ticket.ticketCategory !== 'addon'
        && Number(ticket.price) === 0
        && ticket.allowedRoles?.includes('student')
        && (!ticket.allowedStudentLevels?.length || ticket.allowedStudentLevels.includes('postgraduate'))
    );
    const noFreeTicketMessage = userRole === 'pharmacist' && hasPostgraduateStudentFreeTicket
        ? pharmacistEligibilityStatus === 'pending'
            ? 'Your postgraduate student-rate request for this event is still pending approval.'
            : 'Postgraduate student-rate tickets require approved eligibility for this event. Please submit or review your document from Profile before registering.'
        : userRole === 'student' && !userStudentLevel
        ? 'บัญชี Student ของคุณยังไม่ได้ระบุระดับนักศึกษา จึงยังไม่สามารถจับคู่กับตั๋วนักศึกษาที่จำกัดระดับได้'
        : 'งานนี้อาจไม่มีตั๋วฟรีสำหรับสถานะของคุณ หรือตั๋วอาจหมดแล้ว';

    // Loading state
    if (isLoading || (shouldCheckStudentEligibility && eligibilityLoading)) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto border-4 border-[#8a8a00]/20 border-t-[#8a8a00] rounded-full animate-spin" />
                    <p className="text-gray-500 animate-pulse">กำลังโหลดข้อมูลงาน...</p>
                </div>
            </div>
        );
    }

    // Error / not found
    if (isError || !event) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
                <Navbar />
                <div className="ui-centered-page flex-col">
                    <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
                    <h2 className="text-xl font-bold text-gray-700 mb-4">ไม่พบข้อมูลงานประชุม</h2>
                    <Link href="/events"><Button variant="outline">กลับหน้ารายการ</Button></Link>
                </div>
                <Footer />
            </div>
        );
    }

    // Not logged in — show login prompt
    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
                <Navbar />
                <main className="ui-page-main-tight">
                    <div className="ui-shell max-w-lg">
                        <Link href={`/events/${eventId}`} className="inline-flex items-center text-[#8a8a00] hover:text-[#456339] mb-6 text-sm">
                            <ArrowLeft className="w-4 h-4 mr-1" /> กลับหน้างาน
                        </Link>

                        <div className="ui-page-card bg-white rounded-2xl border border-gray-200 shadow-lg text-center">
                            <div className="w-16 h-16 mx-auto bg-[#8a8a00]/10 rounded-full flex items-center justify-center mb-4">
                                <User className="w-8 h-8 text-[#8a8a00]" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">กรุณาเข้าสู่ระบบ</h1>
                            <p className="text-gray-500 mb-6">คุณต้องเข้าสู่ระบบก่อนลงทะเบียนเข้าร่วมงาน</p>
                            <Link href={`/login?redirect=${encodeURIComponent(`/register/${eventId}`)}`}>
                                <Button className="bg-[#8a8a00] hover:bg-[#456339] text-white px-8 h-12 text-lg font-semibold rounded-xl">
                                    เข้าสู่ระบบ
                                </Button>
                            </Link>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // No free ticket available — redirect hint
    if (!freeTicket && !result) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
                <Navbar />
                <main className="ui-page-main-tight">
                    <div className="ui-shell max-w-lg">
                        <Link href={`/events/${eventId}`} className="inline-flex items-center text-[#8a8a00] hover:text-[#456339] mb-6 text-sm">
                            <ArrowLeft className="w-4 h-4 mr-1" /> กลับหน้างาน
                        </Link>

                        <div className="ui-page-card bg-white rounded-2xl border border-gray-200 shadow-lg text-center">
                            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                            <h1 className="text-xl font-bold text-gray-900 mb-2">ไม่พบตั๋วฟรีสำหรับคุณ</h1>
                            <p className="text-gray-500 mb-6">{noFreeTicketMessage}</p>
                            <Link href={`/events/${eventId}`}>
                                <Button variant="outline" className="border-[#8a8a00]/30 text-[#8a8a00]">กลับหน้างาน</Button>
                            </Link>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // Success state — show registration result
    if (result) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
                <Navbar />
                <main className="ui-page-main-tight">
                    <div className="ui-shell max-w-lg">
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                            {/* Success header */}
                            <div className="bg-gradient-to-r from-[#8a8a00] to-[#737300] p-8 text-center text-white">
                                <div className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle className="w-10 h-10" />
                                </div>
                                <h1 className="text-2xl font-bold mb-1">ลงทะเบียนสำเร็จ!</h1>
                                <p className="text-white/80 text-sm">คุณได้ลงทะเบียนเข้าร่วมงานเรียบร้อยแล้ว</p>
                            </div>

                            {/* Details */}
                            <div className="ui-page-card space-y-5">
                                {/* Reg Code */}
                                <div className="bg-[#8a8a00]/5 border border-[#8a8a00]/20 rounded-xl p-4">
                                    <div className="text-xs text-[#8a8a00] font-medium mb-1">รหัสลงทะเบียน</div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xl font-bold text-gray-900 font-mono tracking-wider">
                                            {result.regCode}
                                        </span>
                                        <button
                                            onClick={handleCopyRegCode}
                                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                                            title="คัดลอก"
                                        >
                                            {copied ? <CheckCircle className="w-5 h-5 text-[#8a8a00]" /> : <Copy className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* QR Code */}
                                <div className="text-center">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(result.regCode)}`}
                                        alt={`QR Code: ${result.regCode}`}
                                        width={200}
                                        height={200}
                                        className="mx-auto rounded-lg"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">แสดง QR Code นี้ที่จุดลงทะเบียน</p>
                                </div>

                                {/* Event & Ticket info */}
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-start gap-3">
                                        <Calendar className="w-4 h-4 text-[#8a8a00] mt-0.5 flex-shrink-0" />
                                        <div>
                                            <div className="font-medium text-gray-900">{result.eventName}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Ticket className="w-4 h-4 text-[#8a8a00] mt-0.5 flex-shrink-0" />
                                        <div>
                                            <div className="text-gray-600">{result.ticketName}</div>
                                            <div className="text-[#8a8a00] font-semibold">ฟรี</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Mail className="w-4 h-4 text-[#8a8a00] mt-0.5 flex-shrink-0" />
                                        <div className="text-gray-600">
                                            อีเมลยืนยันถูกส่งไปที่ {authUser?.email}
                                        </div>
                                    </div>
                                </div>

                                {/* SSO countdown auto-redirect */}
                                {isSsoUser && backToWebsiteUrl && countdown > 0 && (
                                    <div className="text-center text-sm text-gray-500">
                                        กลับไปหน้าเว็บไซต์อัตโนมัติใน <span className="font-bold text-[#8a8a00]">{countdown}</span> วินาที
                                    </div>
                                )}

                                {/* Action buttons */}
                                <div className="flex flex-col gap-3 pt-2">
                                    {backToWebsiteUrl ? (
                                        <a href={backToWebsiteUrl}>
                                            <Button className="w-full h-12 bg-[#8a8a00] hover:bg-[#456339] text-white font-semibold rounded-xl">
                                                <ExternalLink className="w-4 h-4 mr-2" /> กลับไปหน้าเว็บไซต์
                                            </Button>
                                        </a>
                                    ) : (
                                        <Link href="/my-tickets">
                                            <Button className="w-full h-12 bg-[#8a8a00] hover:bg-[#456339] text-white font-semibold rounded-xl">
                                                <Ticket className="w-4 h-4 mr-2" /> ดูตั๋วของฉัน
                                            </Button>
                                        </Link>
                                    )}
                                    <Link href={`/events/${eventId}`}>
                                        <Button variant="outline" className="w-full h-12 border-gray-200 text-gray-600 rounded-xl">
                                            กลับหน้างาน
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // Main registration form — confirm & register
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <Navbar />
                <main className="ui-page-main-tight">
                    <div className="ui-shell max-w-lg">
                    <Link href={`/events/${eventId}`} className="inline-flex items-center text-[#8a8a00] hover:text-[#456339] mb-6 text-sm">
                        <ArrowLeft className="w-4 h-4 mr-1" /> กลับหน้างาน
                    </Link>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#8a8a00] to-[#737300] p-6 text-white">
                            <h1 className="text-xl font-bold mb-1">ลงทะเบียนเข้าร่วมงาน</h1>
                            <p className="text-white/80 text-sm">{event.name}</p>
                        </div>

                        <div className="ui-page-card space-y-5">
                            {/* Event info */}
                            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                {event.startDate && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar className="w-4 h-4 text-[#8a8a00]" />
                                        {new Date(event.startDate).toLocaleDateString('th-TH', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </div>
                                )}
                                {event.venue && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <MapPin className="w-4 h-4 text-[#8a8a00]" />
                                        {event.venue}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm">
                                    <Ticket className="w-4 h-4 text-[#8a8a00]" />
                                    <span className="text-gray-600">{freeTicket!.name}</span>
                                    <span className="ml-auto text-[#8a8a00] font-bold">ฟรี</span>
                                </div>
                                {freeTicket?.allowedRoles?.includes('student') && (
                                    <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
                                        <GraduationCap className="w-4 h-4" />
                                        ระดับนักศึกษา: {formatStudentLevelList(freeTicket.allowedStudentLevels)}
                                        {displayStudentLevel && <span className="text-blue-500">({getStudentLevelLabel(displayStudentLevel)})</span>}
                                    </div>
                                )}
                            </div>

                            {/* User info (pre-filled, read-only) */}
                            <div>
                                <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                    <User className="w-4 h-4 text-[#8a8a00]" />
                                    ข้อมูลผู้ลงทะเบียน
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">ชื่อ-นามสกุล</span>
                                        <span className="font-medium text-gray-900">
                                            {authUser?.firstName} {authUser?.lastName}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">อีเมล</span>
                                        <span className="font-medium text-gray-900">{authUser?.email}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Error message */}
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-start gap-2 text-sm">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Register button */}
                            <Button
                                onClick={handleRegister}
                                disabled={isSubmitting}
                                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-[#8a8a00] to-[#456339] hover:from-[#456339] hover:to-[#3a5430] text-white shadow-lg rounded-xl transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" />กำลังลงทะเบียน...</>
                                ) : (
                                    'ลงทะเบียนฟรี'
                                )}
                            </Button>

                            <p className="text-xs text-center text-gray-400">
                                ยืนยันทันที • ไม่มีค่าใช้จ่าย
                            </p>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
