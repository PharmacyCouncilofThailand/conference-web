'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, RefreshCcw } from 'lucide-react';
import Link from 'next/link';

export default function CancelPage() {
    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            <Navbar />
            <main className="ui-page-main-tight">
                <div className="ui-shell max-w-4xl">
                    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-teal-500/20 blur-3xl rounded-full" />
                            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-[#737300] flex items-center justify-center">
                                <XCircle className="w-12 h-12 text-white" />
                            </div>
                        </div>
                        <div className="inline-block px-4 py-1 bg-teal-500/20 text-teal-400 rounded-full text-sm mb-4">ยกเลิกการชำระเงิน</div>
                        <h1 className="text-3xl sm:text-4xl font-bold mb-4">การชำระเงินถูกยกเลิก</h1>
                        <p className="text-gray-400 mb-8 max-w-lg">คุณได้ยกเลิกการชำระเงิน สามารถลงทะเบียนใหม่ได้ตลอดเวลา</p>

                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 max-w-md text-left">
                            <h3 className="font-bold mb-2">เหตุผลที่อาจเกิดการยกเลิก:</h3>
                            <ul className="text-sm text-gray-400 space-y-2">
                                <li>• กดปุ่มยกเลิกในหน้าชำระเงิน</li>
                                <li>• หมดเวลาในการชำระเงิน</li>
                                <li>• บัตรเครดิตถูกปฏิเสธ</li>
                            </ul>
                        </div>

                        <div className="ui-responsive-actions">
                            <Link href="/events"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />กลับไปหน้างาน</Button></Link>
                            <Button onClick={() => window.history.back()} className="bg-gradient-to-r from-[#8a8a00] to-[#737300]">
                                <RefreshCcw className="w-4 h-4 mr-2" />ลองใหม่อีกครั้ง
                            </Button>
                        </div>

                        <p className="text-xs text-gray-500 mt-8">
                            หากต้องการความช่วยเหลือ <Link href="/contact" className="text-[#8a8a00] hover:underline">ติดต่อทีมงาน</Link>
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
