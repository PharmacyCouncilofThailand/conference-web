'use client';

import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getEventById } from '@/lib/services';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import {
    CheckCircle, Calendar, MapPin, Mail, MessageSquare,
    Download, Home, Ticket, ArrowRight, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { Round } from '@/types';

import { Suspense } from 'react';

function PaymentSuccessContent() {
    const searchParams = useSearchParams();
    const eventId = searchParams.get('eventId') || '';
    const roundId = searchParams.get('roundId') || '';
    const deliveryEmail = searchParams.get('email') === 'true';
    const deliverySms = searchParams.get('sms') === 'true';

    const { data: event, isLoading } = useQuery({
        queryKey: ['event', eventId],
        queryFn: async () => {
            if (!eventId) return null;
            const result = await getEventById(eventId);
            return result || null;
        },
        enabled: !!eventId,
        retry: 1,
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                Loading...
            </div>
        );
    }

    const round = event?.rounds?.find((r: Round) => r.id === roundId) || event?.rounds?.[0];

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Navbar />

            {/* Main Content */}
            <div className="ui-page-main flex-grow">
                <div className="ui-shell max-w-2xl">

                    {/* Success Animation */}
                    <div className="text-center mb-8">
                        <div className="relative inline-block">
                            <div className="absolute inset-0 bg-[#8a8a00]/30 blur-[60px] rounded-full animate-pulse" />
                            <div className="relative w-24 h-24 bg-gradient-to-br from-[#8a8a00] to-[#737300] rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(138,138,0,0.4)]">
                                <CheckCircle className="w-12 h-12 text-white" />
                            </div>
                        </div>

                        <div className="mt-6 space-y-2">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#8a8a00]/10 border border-[#8a8a00]/30 text-[#8a8a00] text-sm">
                                <Sparkles className="w-4 h-4" />
                                ลงทะเบียนสำเร็จ
                            </div>
                            <h1 className="ui-section-title font-bold">
                                ชำระเงินเรียบร้อยแล้ว!
                            </h1>
                            <p className="text-gray-400">
                                ขอบคุณสำหรับการลงทะเบียน E-Ticket จะถูกส่งไปยังช่องทางที่คุณเลือก
                            </p>
                        </div>
                    </div>

                    {/* Event Summary Card */}
                    {event && (
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl mb-6">
                            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Ticket className="w-5 h-5 text-[#8a8a00]" />
                                รายละเอียดการลงทะเบียน
                            </h2>

                            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                <img
                                    src={event.coverImage}
                                    alt={event.name}
                                    className="w-20 h-20 rounded-xl object-cover bg-gray-800"
                                />
                                <div>
                                    <h3 className="font-bold">{event.name}</h3>
                                    <div className="text-sm text-gray-400 space-y-1 mt-1">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            {round?.date} เวลา {round?.time}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            {round?.location}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-4">
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-400">ค่าลงทะเบียน</span>
                                    <span className="font-bold text-[#8a8a00]">฿{event.price?.toLocaleString()}</span>
                                </div>
                                {event.cpeCredits && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">หน่วยกิต CPE</span>
                                        <span className="font-bold text-[#8a8a00]">{event.cpeCredits} หน่วยกิต</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* E-Ticket Delivery Info */}
                    <div className="bg-gradient-to-br from-[#737300]/30 to-[#8a8a00]/30 border border-[#8a8a00]/20 rounded-3xl p-6 backdrop-blur-xl mb-6">
                        <h2 className="font-bold text-lg mb-4">📬 E-Ticket จะถูกส่งไปยัง</h2>

                        <div className="space-y-3">
                            {(deliveryEmail || (!deliveryEmail && !deliverySms)) && (
                                <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4">
                                    <div className="w-10 h-10 rounded-lg bg-[#8a8a00]/20 flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-[#8a8a00]" />
                                    </div>
                                    <div>
                                        <div className="font-bold">Email</div>
                                        <div className="text-sm text-gray-400">กรุณาตรวจสอบกล่องจดหมาย</div>
                                    </div>
                                </div>
                            )}

                            {deliverySms && (
                                <div className="flex items-center gap-3 bg-white/5 rounded-xl p-4">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                        <MessageSquare className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="font-bold">SMS</div>
                                        <div className="text-sm text-gray-400">กรุณาตรวจสอบข้อความ</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 p-3 bg-[#8a8a00]/10 border border-[#8a8a00]/20 rounded-lg text-[#a0a030] text-sm">
                            💡 E-Ticket จะถูกส่งภายใน 5-10 นาที หากไม่ได้รับกรุณาตรวจสอบโฟลเดอร์ Spam
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="ui-responsive-actions">
                        <Link href="/" className="flex-1">
                            <Button variant="outline" className="w-full border-white/20 hover:bg-white/10 h-12">
                                <Home className="w-4 h-4 mr-2" />
                                กลับหน้าหลัก
                            </Button>
                        </Link>
                        <Link href="/events" className="flex-1">
                            <Button className="w-full bg-gradient-to-r from-[#8a8a00] to-[#737300] hover:from-[#737300] hover:to-[#686805] h-12">
                                ดูงานอื่นๆ
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                Loading...
            </div>
        }>
            <PaymentSuccessContent />
        </Suspense>
    );
}
