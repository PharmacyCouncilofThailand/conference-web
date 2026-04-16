'use client';

import { useState, useEffect, Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    User, Mail, Phone, Building2, IdCard,
    Calendar, CheckCircle, ArrowLeft,
    LogOut, Loader2, Ticket, Clock, XCircle, AlertCircle, Receipt
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRegistrations, UserRegistration } from '@/lib/services';
import { QRCodeTicket, QRCodeTicketCompact } from '@/components/ticket/QRCodeTicket';
import { cn } from '@/lib/utils';

type MenuTab = 'profile' | 'tickets' | 'payment';
type PaymentStatus = 'all' | 'pending' | 'completed' | 'failed' | 'cancelled';

function resolveMenuTab(value: string | null): MenuTab {
    if (value === 'tickets' || value === 'payment' || value === 'profile') {
        return value;
    }
    return 'profile';
}

export default function ProfilePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-[#8a8a00] animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">กำลังโหลด...</p>
                </div>
            </div>
        }>
            <ProfilePageContent />
        </Suspense>
    );
}

function ProfilePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isLoggedIn, isLoading: authLoading, logout, token } = useAuth();
    const requestedTab = resolveMenuTab(searchParams.get('tab'));

    const [activeTab, setActiveTab] = useState<MenuTab>(requestedTab);
    const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus>('all');
    const [viewingQrTicket, setViewingQrTicket] = useState<UserRegistration | null>(null);
    const [mounted, setMounted] = useState(false);

    // Trigger entrance animation
    useEffect(() => {
        requestAnimationFrame(() => setMounted(true));
    }, []);

    useEffect(() => {
        setActiveTab(requestedTab);
    }, [requestedTab]);

    // Real data from API
    const [registrations, setRegistrations] = useState<UserRegistration[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Fetch user's registrations when logged in
    useEffect(() => {
        async function fetchData() {
            if (isLoggedIn && token) {
                setIsLoadingData(true);
                try {
                    const data = await getUserRegistrations(token);
                    setRegistrations(data);
                } catch {
                    // Silent fail for registration fetch
                }
                setIsLoadingData(false);
            }
        }
        fetchData();
    }, [isLoggedIn, token]);

    // Derived data
    // Show both confirmed and pending tickets in My Tickets
    const myTickets = registrations.filter(r => r.status === 'confirmed' || r.status === 'pending');
    const paymentHistory = registrations.filter(r => r.payment !== null);
    const filteredPayments = paymentStatusFilter === 'all'
        ? paymentHistory
        : paymentHistory.filter(p => p.payment?.status === paymentStatusFilter);

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            router.push('/login');
        }
    }, [authLoading, isLoggedIn, router]);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const getPaymentStatusConfig = (status: string) => {
        switch (status) {
            case 'pending':
                return { icon: Clock, label: 'Waiting Confirm', color: 'yellow' };
            case 'completed':
                return { icon: CheckCircle, label: 'Completed', color: 'green' };
            case 'failed':
                return { icon: XCircle, label: 'Failed', color: 'red' };
            case 'cancelled':
                return { icon: XCircle, label: 'Cancelled', color: 'red' };
            default:
                return { icon: AlertCircle, label: status, color: 'gray' };
        }
    };

    // Loading state
    if (authLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-[#8a8a00] animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    // Not logged in (will redirect)
    if (!isLoggedIn || !user) {
        return null;
    }

    const menuItems = [
        { key: 'profile' as MenuTab, label: 'Profile', icon: User },
        { key: 'tickets' as MenuTab, label: 'My Ticket', icon: Ticket },
        { key: 'payment' as MenuTab, label: 'Payment History', icon: Receipt },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
            <Navbar />

            {/* Header */}
            <section className="relative pt-32 pb-12 px-6 bg-white border-b border-gray-200 overflow-hidden">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#737300]/5 to-transparent" />
                </div>

                <div className={`container mx-auto max-w-6xl scroll-animate fade-up stagger-1 ${mounted ? 'is-visible' : ''}`}>
                    <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#8a8a00] mb-6 transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span>กลับหน้าหลัก</span>
                    </Link>
                    <h1 className="text-4xl font-bold text-[#737300]">โปรไฟล์ของฉัน</h1>
                    <p className="text-gray-500 mt-2">จัดการข้อมูลส่วนตัวและดูประวัติการซื้อ</p>
                </div>
            </section>

            {/* Main Content */}
            <section className="flex-1 py-8 px-6 bg-gray-50">
                <div className="container mx-auto max-w-6xl">
                    <div className="flex flex-col lg:flex-row gap-6">

                        {/* Left Sidebar */}
                        <div className={`lg:w-72 flex-shrink-0 scroll-animate slide-left stagger-2 ${mounted ? 'is-visible' : ''}`}>
                            <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 sticky top-24">
                                {/* Profile Avatar */}
                                <div className="text-center mb-6">
                                    <div className="inline-block">
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#737300] to-[#8a8a00] flex items-center justify-center text-white text-3xl font-bold mx-auto border-4 border-white shadow-md">
                                            {user.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-900 mt-3">{user.name}</h2>
                                </div>

                                {/* Menu Items */}
                                <nav className="space-y-1">
                                    {menuItems.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = activeTab === item.key;
                                        return (
                                            <button
                                                key={item.key}
                                                onClick={() => setActiveTab(item.key)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all",
                                                    isActive
                                                        ? "bg-[#8a8a00]/10 text-[#8a8a00] border-l-4 border-[#8a8a00]"
                                                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                                )}
                                            >
                                                <Icon className="w-5 h-5" />
                                                {item.label}
                                            </button>
                                        );
                                    })}
                                </nav>

                                {/* Admin Dashboard Link */}
                                {(user.role === 'admin' || user.role === 'staff') && (
                                    <div className="mt-4">
                                        <Link href="/dashboard" className="block">
                                            <Button
                                                variant="outline"
                                                className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-[#8a8a00]"
                                            >
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                                </svg>
                                                ไปหน้า Dashboard
                                            </Button>
                                        </Link>
                                    </div>
                                )}

                                {/* Logout Button */}
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-medium transition-all"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        ออกจากระบบ
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Content Area */}
                        <div className={`flex-1 scroll-animate fade-up stagger-3 ${mounted ? 'is-visible' : ''}`}>
                            <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 sm:p-8">

                                {/* Profile Tab */}
                                {activeTab === 'profile' && (
                                    <div className="animate-fade-in">
                                        <h2 className="text-2xl font-bold tracking-tight text-[#737300] mb-2">
                                            Profile Information
                                        </h2>
                                        <p className="text-gray-500 text-sm mb-8">
                                            ข้อมูลที่จะแสดงบนตั๋วและใช้ยืนยันตัวตนก่อนเข้างาน
                                        </p>

                                        <div className="space-y-4">
                                            {/* Name */}
                                            <div className="flex items-center gap-4 py-4 border-b border-gray-100">
                                                <div className="w-10 h-10 rounded-xl bg-[#8a8a00]/10 flex items-center justify-center">
                                                    <User className="w-5 h-5 text-[#8a8a00]" />
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-500">ชื่อ-นามสกุล</div>
                                                    <div className="font-medium text-gray-900">{user.name || 'ไม่ระบุ'}</div>
                                                </div>
                                            </div>

                                            {/* Email */}
                                            <div className="flex items-center gap-4 py-4 border-b border-gray-100">
                                                <div className="w-10 h-10 rounded-xl bg-[#737300]/10 flex items-center justify-center">
                                                    <Mail className="w-5 h-5 text-[#737300]" />
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-500">อีเมล</div>
                                                    <div className="font-medium text-gray-900">{user.email}</div>
                                                </div>
                                            </div>

                                            {/* Phone */}
                                            <div className="flex items-center gap-4 py-4 border-b border-gray-100">
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                                    <Phone className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-500">เบอร์โทรศัพท์</div>
                                                    <div className="font-medium text-gray-900">{user.phone || '-'}</div>
                                                </div>
                                            </div>

                                            {/* Pharmacy License */}
                                            <div className="flex items-center gap-4 py-4 border-b border-gray-100">
                                                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                                                    <IdCard className="w-5 h-5 text-purple-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-500">เลขใบอนุญาต</div>
                                                    <div className="font-medium text-gray-900">
                                                        {user.pharmacyLicenseId ? `ภ. ${user.pharmacyLicenseId}` : '-'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* My Ticket Tab */}
                                {activeTab === 'tickets' && (
                                    <div className="animate-fade-in">
                                        <h2 className="text-2xl font-bold tracking-tight text-[#737300] mb-2">
                                            My Tickets
                                        </h2>
                                        <p className="text-gray-500 text-sm mb-8">
                                            ตั๋วงานประชุมที่คุณจองไว้
                                        </p>

                                        {isLoadingData ? (
                                            <div className="text-center py-16">
                                                <Loader2 className="w-8 h-8 text-[#8a8a00] animate-spin mx-auto mb-4" />
                                                <p className="text-gray-400">กำลังโหลดข้อมูล...</p>
                                            </div>
                                        ) : myTickets.length === 0 ? (
                                            <div className="text-center py-16 text-gray-400">
                                                <Ticket className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                                <p className="text-lg">ยังไม่มีตั๋ว</p>
                                                <Link href="/events">
                                                    <Button className="mt-4 bg-[#8a8a00] hover:bg-[#737300] text-white">
                                                        ดูงานประชุม
                                                    </Button>
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {myTickets.map((ticket) => (
                                                    <div
                                                        key={ticket.regCode}
                                                        className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5 hover:border-[#737300]/50 hover:shadow-md transition-all"
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h4 className="font-bold text-gray-900 text-lg">{ticket.event?.eventName || 'Unknown Event'}</h4>
                                                                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                                                                    <span className="flex items-center gap-2">
                                                                        <Calendar className="w-4 h-4 text-[#8a8a00]" />
                                                                        {ticket.event?.startDate
                                                                            ? `${new Date(ticket.event.startDate).toLocaleDateString('th-TH', { year: '2-digit', month: 'short', day: 'numeric' })} ${new Date(ticket.event.startDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${ticket.event.endDate ? new Date(ticket.event.endDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''}`
                                                                            : '-'}
                                                                    </span>
                                                                    <span className="flex items-center gap-2">
                                                                        <Building2 className="w-4 h-4 text-[#8a8a00]" />
                                                                        {ticket.event?.location || 'TBA'}
                                                                    </span>
                                                                </div>
                                                                <div className="mt-2 text-xs text-gray-400 font-mono">{ticket.regCode}</div>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-3">
                                                                {ticket.status === 'confirmed' ? (
                                                                    <QRCodeTicketCompact
                                                                        regCode={ticket.regCode}
                                                                        onClick={() => setViewingQrTicket(ticket)}
                                                                    />
                                                                ) : (
                                                                    <>
                                                                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border bg-yellow-50 text-yellow-700 border-yellow-200">
                                                                            <Clock className="w-4 h-4" />
                                                                            Waiting Payment
                                                                        </span>
                                                                        <Link href={`/checkout/${ticket.event?.id}?ticket=${ticket.ticketType?.id}&round=${ticket.event?.id}`} className="mt-2">
                                                                            <Button size="sm" className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0">
                                                                                Pay Now
                                                                            </Button>
                                                                        </Link>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Payment History Tab */}
                                {activeTab === 'payment' && (
                                    <div className="animate-fade-in">
                                        <h2 className="text-2xl font-bold tracking-tight text-[#737300] mb-2">
                                            Payment History
                                        </h2>
                                        <p className="text-gray-500 text-sm mb-6">
                                            ประวัติการชำระเงินทั้งหมด
                                        </p>

                                        {/* Status Filter */}
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {[
                                                { key: 'all' as PaymentStatus, label: 'ทั้งหมด' },
                                                { key: 'pending' as PaymentStatus, label: 'Waiting Confirm' },
                                                { key: 'completed' as PaymentStatus, label: 'Completed' },
                                                { key: 'failed' as PaymentStatus, label: 'Failed' },
                                                { key: 'cancelled' as PaymentStatus, label: 'Cancelled' },
                                            ].map((filter) => (
                                                <button
                                                    key={filter.key}
                                                    onClick={() => setPaymentStatusFilter(filter.key)}
                                                    className={cn(
                                                        "px-4 py-2 rounded-full text-sm font-medium transition-all",
                                                        paymentStatusFilter === filter.key
                                                            ? "bg-[#8a8a00] text-white"
                                                            : "bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                                    )}
                                                >
                                                    {filter.label}
                                                </button>
                                            ))}
                                        </div>

                                        {isLoadingData ? (
                                            <div className="text-center py-16">
                                                <Loader2 className="w-8 h-8 text-[#8a8a00] animate-spin mx-auto mb-4" />
                                                <p className="text-gray-400">กำลังโหลดข้อมูล...</p>
                                            </div>
                                        ) : filteredPayments.length === 0 ? (
                                            <div className="text-center py-16 text-gray-400">
                                                <Receipt className="w-16 h-16 mx-auto mb-4 opacity-50 text-gray-300" />
                                                <p className="text-lg">ไม่พบรายการ</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {filteredPayments.map((payment) => {
                                                    const statusConfig = getPaymentStatusConfig(payment.payment?.status || 'pending');
                                                    const StatusIcon = statusConfig.icon;

                                                    return (
                                                        <div
                                                            key={payment.id}
                                                            className={cn(
                                                                "rounded-2xl p-5 transition-all",
                                                                payment.payment?.status === 'pending'
                                                                    ? "bg-orange-50 border border-orange-200"
                                                                    : "bg-white border border-gray-200 hover:border-[#737300]/50 hover:shadow-sm"
                                                            )}
                                                        >
                                                            {/* Header with Order Date and Purchase Number */}
                                                            <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
                                                                <span>Order on {payment.createdAt ? new Date(payment.createdAt).toLocaleString('th-TH') : '-'}</span>
                                                                <span className="font-mono text-gray-400">Purchase Number {payment.regCode}</span>
                                                            </div>

                                                            {/* Event Name */}
                                                            <h4 className="font-bold text-gray-900 text-lg">{payment.event?.eventName || 'Unknown Event'}</h4>

                                                            {/* Ticket Info */}
                                                            <div className="flex justify-between items-center mt-3">
                                                                <div className="text-sm text-gray-500">
                                                                    <div className="flex items-center gap-2">
                                                                        <Ticket className="w-4 h-4 text-orange-500" />
                                                                        {payment.ticketType?.name || 'Ticket'} <span className="text-gray-300 mx-1">|</span> {payment.event?.startDate ? new Date(payment.event.startDate).toLocaleDateString('th-TH') : '-'}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="font-bold text-xl text-[#8a8a00]">
                                                                        {parseFloat(payment.payment?.amount || '0').toLocaleString()} THB
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Status Badge and Purchase Again Button */}
                                                            {payment.payment?.status === 'pending' ? (
                                                                <div className="mt-4 pt-4 border-t border-orange-200">
                                                                    <div className="flex justify-between items-center">
                                                                        <div className="text-sm">
                                                                            <p className="text-gray-600">Please purchase by <span className="text-orange-600 font-semibold">QR code</span> or</p>
                                                                            <Link href={`/events/${payment.event?.id}`} className="text-orange-600 hover:text-orange-700 underline">
                                                                                change purchase channel
                                                                            </Link>
                                                                        </div>
                                                                        <Link href={`/events/${payment.event?.id}`}>
                                                                            <Button className="bg-[#8a8a00] hover:bg-[#737300] text-white font-bold px-6 py-2 rounded-full shadow-sm hover:shadow-md transition-all">
                                                                                Purchase again
                                                                            </Button>
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex justify-end mt-4">
                                                                    <span className={cn(
                                                                        "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs border",
                                                                        statusConfig.color === 'yellow' ? 'bg-yellow-600/20 text-yellow-300 border-yellow-500/30' :
                                                                            statusConfig.color === 'green' ? 'bg-green-600/20 text-green-300 border-green-500/30' :
                                                                                statusConfig.color === 'red' ? 'bg-red-600/20 text-red-300 border-red-500/30' :
                                                                                    'bg-gray-600/20 text-gray-300 border-gray-500/30'
                                                                    )}>
                                                                        <StatusIcon className="w-3 h-3" />
                                                                        {statusConfig.label}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />

            {/* QR Code View Modal */}
            <Dialog open={!!viewingQrTicket} onOpenChange={(open) => !open && setViewingQrTicket(null)}>
                <DialogContent className="bg-white border-gray-200 text-gray-900 sm:max-w-md shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-center text-xl text-[#737300]">Ticket QR Code</DialogTitle>
                        <DialogDescription className="text-center text-gray-500">
                            Show this QR code at the event entrance for check-in
                        </DialogDescription>
                    </DialogHeader>
                    {viewingQrTicket && (
                        <div className="py-4">
                            <QRCodeTicket
                                regCode={viewingQrTicket.regCode}
                                eventName={viewingQrTicket.event?.eventName}
                                size={250}
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
