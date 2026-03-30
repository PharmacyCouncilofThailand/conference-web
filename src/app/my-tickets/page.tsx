'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Loader2, Ticket } from 'lucide-react';

export default function MyTicketsPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/profile?tab=tickets');
    }, [router]);

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />

            <div className="flex-grow flex items-center justify-center px-4">
                <div className="text-center space-y-4 max-w-md">
                    <div className="w-20 h-20 mx-auto bg-[#537547]/10 rounded-full flex items-center justify-center">
                        <Ticket className="w-10 h-10 text-[#537547]" />
                    </div>
                    <Loader2 className="w-8 h-8 animate-spin text-[#537547] mx-auto" />
                    <h1 className="text-xl font-bold text-gray-900">กำลังพาไปยังตั๋วของคุณ</h1>
                    <p className="text-sm text-gray-500">กรุณารอสักครู่ ระบบกำลังเปิดแท็บ My Ticket ในหน้าโปรไฟล์</p>
                </div>
            </div>

            <Footer />
        </div>
    );
}
