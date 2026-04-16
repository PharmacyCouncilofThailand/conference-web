'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Phone, Mail, MapPin, Clock, Send, ChevronDown, ChevronUp,
    MessageCircle, HelpCircle, FileText, CreditCard, Calendar, Users, CheckCircle
} from 'lucide-react';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';

// FAQ Data
const FAQ_ITEMS = [
    {
        category: 'การลงทะเบียน',
        icon: FileText,
        questions: [
            {
                q: 'ฉันสามารถลงทะเบียนหลายงานพร้อมกันได้หรือไม่?',
                a: 'ได้ครับ คุณสามารถลงทะเบียนเข้าร่วมหลายงานได้ โดยแต่ละงานจะถูกจัดการแยกกัน และจะได้รับ E-Ticket แยกสำหรับแต่ละงาน'
            },
            {
                q: 'ฉันสามารถยกเลิกหรือเปลี่ยนแปลงการลงทะเบียนได้หรือไม่?',
                a: 'สามารถยกเลิกได้ก่อนวันงาน 7 วัน โดยจะได้รับเงินคืนเต็มจำนวน หากต้องการเปลี่ยนแปลงกรุณาติดต่อ staff ล่วงหน้า'
            },
            {
                q: 'ลงทะเบียนแล้วแต่ไม่ได้รับ E-Ticket?',
                a: 'กรุณาตรวจสอบโฟลเดอร์ Spam ในอีเมล หากยังไม่พบกรุณาติดต่อเราผ่านช่องทางด้านล่าง'
            }
        ]
    },
    {
        category: 'การชำระเงิน',
        icon: CreditCard,
        questions: [
            {
                q: 'รองรับช่องทางการชำระเงินอะไรบ้าง?',
                a: 'รองรับ Thai QR Payment (PromptPay), บัตรเครดิต/เดบิต (Visa, Mastercard, JCB)'
            },
            {
                q: 'ชำระเงินแล้วแต่ยังไม่ได้รับการยืนยัน?',
                a: 'การชำระเงินผ่าน QR Payment อาจใช้เวลา 5-15 นาทีในการยืนยัน หากเกิน 30 นาทีกรุณาติดต่อเรา'
            },
            {
                q: 'สามารถขอใบเสร็จรับเงินได้หรือไม่?',
                a: 'ได้ครับ ใบเสร็จจะถูกส่งไปพร้อม E-Ticket ทางอีเมล หรือสามารถขอเพิ่มเติมได้ที่จุดลงทะเบียนในวันงาน'
            }
        ]
    },
    {
        category: 'หน่วยกิต CPE',
        icon: Calendar,
        questions: [
            {
                q: 'หน่วยกิต CPE จะได้รับเมื่อไหร่?',
                a: 'หน่วยกิต CPE จะถูกบันทึกภายใน 7 วันหลังจบงาน โดยจะแจ้งเตือนทางอีเมลเมื่อบันทึกเรียบร้อย'
            },
            {
                q: 'ต้องใช้เลขใบประกอบวิชาชีพในการลงทะเบียนหรือไม่?',
                a: 'จำเป็นกรณีที่ต้องการรับหน่วยกิต CPE เท่านั้น หากเป็นบุคคลทั่วไปไม่จำเป็นต้องกรอก'
            }
        ]
    },
    {
        category: 'วันงาน',
        icon: Users,
        questions: [
            {
                q: 'ต้องพิมพ์ E-Ticket หรือไม่?',
                a: 'ไม่จำเป็นครับ สามารถแสดง E-Ticket ผ่านหน้าจอมือถือได้เลย Staff จะสแกน QR Code จากหน้าจอ'
            },
            {
                q: 'มาถึงช้ากว่ากำหนดได้หรือไม่?',
                a: 'สามารถมาช้าได้ แต่อาจพลาดเนื้อหาบางส่วน และการเข้าห้องประชุมอาจถูกจำกัดในบางช่วง'
            }
        ]
    }
];

export default function ContactPage() {
    const [openFaq, setOpenFaq] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        regCode: '',
        category: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [ticketId, setTicketId] = useState('');
    const [mounted, setMounted] = useState(false);

    const { ref: contentRef, isVisible: contentVisible } = useScrollAnimation();
    const { ref: faqRef, isVisible: faqVisible } = useScrollAnimation();

    useEffect(() => {
        requestAnimationFrame(() => setMounted(true));
    }, []);

    const toggleFaq = (id: string) => {
        setOpenFaq(openFaq === id ? null : id);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Generate Ticket ID
        const id = `TKT-${Date.now().toString(36).toUpperCase()}`;
        setTicketId(id);

        setIsSubmitting(false);
        setSubmitted(true);
        setFormData({ name: '', email: '', phone: '', regCode: '', category: '', subject: '', message: '' });
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 flex flex-col">
            <Navbar />

            {/* Header */}
            <section className="relative pt-32 pb-16 px-6 bg-gradient-to-br from-[#8a8a00] via-[#456339] to-[#3d5733] overflow-hidden">
                {/* Animated background shapes */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-10 w-64 h-64 bg-white/5 blur-[100px] rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
                    <div className="absolute bottom-0 right-10 w-96 h-96 bg-white/5 blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/3 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
                </div>

                <div className="container mx-auto max-w-4xl text-center relative z-10">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/25 text-white/90 text-sm mb-4 scroll-animate fade-up ${mounted ? 'is-visible' : ''}`}>
                        <HelpCircle className="w-4 h-4" />
                        ช่วยเหลือ
                    </div>
                    <h1 className={`text-4xl md:text-5xl font-bold text-white scroll-animate fade-up stagger-1 ${mounted ? 'is-visible' : ''}`}>ติดต่อเรา</h1>
                    <p className={`text-white/80 mt-4 max-w-xl mx-auto scroll-animate fade-up stagger-2 ${mounted ? 'is-visible' : ''}`}>
                        มีคำถามหรือต้องการความช่วยเหลือ? เราพร้อมให้บริการคุณ
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-16 px-6 flex-grow">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid lg:grid-cols-3 gap-12">

                        {/* Left: Contact Info + Form */}
                        <div ref={contentRef} className="lg:col-span-2 space-y-8">

                            {/* Contact Cards */}
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className={`bg-white border border-gray-200 rounded-2xl p-5 text-center hover:border-[#8a8a00]/50 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 scroll-animate fade-up stagger-1 ${contentVisible ? 'is-visible' : ''}`}>
                                    <div className="w-12 h-12 rounded-xl bg-[#8a8a00]/10 flex items-center justify-center mx-auto mb-3 transition-transform hover:scale-110 hover:rotate-3">
                                        <Phone className="w-6 h-6 text-[#8a8a00]" />
                                    </div>
                                    <h3 className="font-bold mb-1 text-gray-900">โทรศัพท์</h3>
                                    <p className="text-sm text-gray-500">02-123-4567</p>
                                </div>

                                <div className={`bg-white border border-gray-200 rounded-2xl p-5 text-center hover:border-[#8a8a00]/50 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 scroll-animate fade-up stagger-2 ${contentVisible ? 'is-visible' : ''}`}>
                                    <div className="w-12 h-12 rounded-xl bg-[#8a8a00]/10 flex items-center justify-center mx-auto mb-3 transition-transform hover:scale-110 hover:rotate-3">
                                        <Mail className="w-6 h-6 text-[#8a8a00]" />
                                    </div>
                                    <h3 className="font-bold mb-1 text-gray-900">อีเมล</h3>
                                    <p className="text-sm text-gray-500">support@eventflow.th</p>
                                </div>

                                <div className={`bg-white border border-gray-200 rounded-2xl p-5 text-center hover:border-[#8a8a00]/50 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 scroll-animate fade-up stagger-3 ${contentVisible ? 'is-visible' : ''}`}>
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-3 transition-transform hover:scale-110 hover:rotate-3">
                                        <Clock className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <h3 className="font-bold mb-1 text-gray-900">เวลาทำการ</h3>
                                    <p className="text-sm text-gray-500">จ-ศ 9:00-17:00</p>
                                </div>
                            </div>

                            {/* Contact Form */}
                            <div className={`bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm scroll-animate fade-up stagger-4 ${contentVisible ? 'is-visible' : ''}`}>
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[#737300]">
                                    <MessageCircle className="w-5 h-5 text-[#8a8a00]" />
                                    ส่งข้อความถึงเรา
                                </h2>

                                {submitted ? (
                                    <div className="text-center py-12 scroll-animate scale-in is-visible">
                                        <div className="w-16 h-16 bg-[#8a8a00]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle className="w-8 h-8 text-[#8a8a00]" />
                                        </div>
                                        <h3 className="text-xl font-bold text-[#8a8a00] mb-2">ส่งข้อความสำเร็จ!</h3>
                                        <p className="text-gray-500 mb-4">เราจะติดต่อกลับภายใน 24 ชั่วโมง</p>
                                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 inline-block">
                                            <p className="text-sm text-gray-500 mb-1">หมายเลข Ticket</p>
                                            <p className="text-xl font-mono font-bold text-[#8a8a00]">{ticketId}</p>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-4">กรุณาเก็บหมายเลขนี้ไว้อ้างอิง</p>
                                        <Button
                                            onClick={() => setSubmitted(false)}
                                            variant="outline"
                                            className="mt-4 border-gray-300 text-gray-700 hover:bg-gray-50 transition-transform hover:scale-105"
                                        >
                                            ส่งข้อความใหม่
                                        </Button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name" className="text-gray-700">ชื่อ-นามสกุล *</Label>
                                                <Input
                                                    id="name"
                                                    required
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    placeholder="กรอกชื่อของคุณ"
                                                    className="bg-gray-50 border-gray-200 focus:border-[#8a8a00] text-gray-900 transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email" className="text-gray-700">อีเมล *</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    required
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    placeholder="your@email.com"
                                                    className="bg-gray-50 border-gray-200 focus:border-[#8a8a00] text-gray-900 transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="phone" className="text-gray-700">เบอร์โทร (ถ้ามี)</Label>
                                                <Input
                                                    id="phone"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    placeholder="08X-XXX-XXXX"
                                                    className="bg-gray-50 border-gray-200 focus:border-[#8a8a00] text-gray-900 transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="regCode" className="text-gray-700">รหัสลงทะเบียน (ถ้ามี)</Label>
                                                <Input
                                                    id="regCode"
                                                    value={formData.regCode}
                                                    onChange={(e) => setFormData({ ...formData, regCode: e.target.value })}
                                                    placeholder="REG-XXXXXX"
                                                    className="bg-gray-50 border-gray-200 focus:border-[#8a8a00] text-gray-900 transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="category" className="text-gray-700">หมวดหมู่ *</Label>
                                            <select
                                                id="category"
                                                required
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 focus:border-[#8a8a00] focus:outline-none transition-all"
                                            >
                                                <option value="">-- เลือกหมวดหมู่ --</option>
                                                <option value="registration">การลงทะเบียน</option>
                                                <option value="payment">การชำระเงิน</option>
                                                <option value="checkin">Check-in / QR Code</option>
                                                <option value="cpe">หน่วยกิต CPE</option>
                                                <option value="other">อื่นๆ</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="subject" className="text-gray-700">หัวข้อ *</Label>
                                            <Input
                                                id="subject"
                                                required
                                                value={formData.subject}
                                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                placeholder="เรื่องที่ต้องการติดต่อ"
                                                className="bg-gray-50 border-gray-200 focus:border-[#8a8a00] text-gray-900 transition-all"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="message" className="text-gray-700">ข้อความ</Label>
                                            <textarea
                                                id="message"
                                                required
                                                value={formData.message}
                                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                                placeholder="รายละเอียดที่ต้องการสอบถาม..."
                                                rows={5}
                                                className="w-full rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#8a8a00] focus:outline-none resize-none transition-all"
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full bg-[#8a8a00] hover:bg-[#456339] text-white h-12 transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:hover:scale-100"
                                        >
                                            {isSubmitting ? (
                                                <>กำลังส่ง...</>
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4 mr-2" />
                                                    ส่งข้อความ
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                )}
                            </div>
                        </div>

                        {/* Right: FAQ */}
                        <div ref={faqRef} className="lg:col-span-1">
                            <div>
                                <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 text-[#737300] scroll-animate fade-up ${faqVisible ? 'is-visible' : ''}`}>
                                    <HelpCircle className="w-5 h-5 text-[#8a8a00]" />
                                    คำถามที่พบบ่อย
                                </h2>

                                <div className="space-y-4">
                                    {FAQ_ITEMS.map((category, catIdx) => (
                                        <div
                                            key={category.category}
                                            className={`space-y-2 scroll-animate fade-up stagger-${catIdx + 1} ${faqVisible ? 'is-visible' : ''}`}
                                        >
                                            <div className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-wider">
                                                <category.icon className="w-4 h-4" />
                                                {category.category}
                                            </div>

                                            {category.questions.map((item, idx) => {
                                                const faqId = `${category.category}-${idx}`;
                                                const isOpen = openFaq === faqId;

                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`bg-white border rounded-xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-[#8a8a00]/50 shadow-md' : 'border-gray-200 hover:border-[#8a8a00]/30'}`}
                                                    >
                                                        <button
                                                            onClick={() => toggleFaq(faqId)}
                                                            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                                                        >
                                                            <span className="text-sm font-medium pr-4 text-gray-900">{item.q}</span>
                                                            <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                                                                <ChevronDown className={`w-4 h-4 flex-shrink-0 ${isOpen ? 'text-[#8a8a00]' : 'text-gray-400'}`} />
                                                            </div>
                                                        </button>

                                                        <div
                                                            className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                                                        >
                                                            <div className="overflow-hidden">
                                                                <div className="px-4 pb-4 text-sm text-gray-500 border-t border-gray-100 pt-3">
                                                                    {item.a}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
