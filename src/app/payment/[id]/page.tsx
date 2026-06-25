'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getEventById } from '@/lib/services';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CheckCircle, QrCode, Copy, Download, ArrowRight, ArrowLeft, Clock, CreditCard, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function PaymentPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const eventId = params.id as string;
    const amount = searchParams.get('amount') || '0';
    const method = searchParams.get('method') || 'qr'; // 'qr' or 'credit_card'
    const [refNo] = useState(() => `REF-${Math.floor(Math.random() * 1000000)}`);
    const roundId = searchParams.get('round') || 'round-1';

    const [cardSuccess, setCardSuccess] = useState(false);

    const { data: event } = useQuery({
        queryKey: ['event', eventId],
        queryFn: async () => {
            const result = await getEventById(eventId);
            if (!result) throw new Error('Event not found');
            return result;
        },
        enabled: !!eventId,
        retry: 1,
    });

    useEffect(() => {
        // Auto-simulate card processing if method is credit_card
        if (method === 'credit_card' && !cardSuccess) {
            const timer = setTimeout(() => {
                setCardSuccess(true);
            }, 3000); // 3 seconds simulation
            return () => clearTimeout(timer);
        }
    }, [method, cardSuccess]);


    if (!event) return <div className="min-h-screen bg-white text-[#737300] flex items-center justify-center">Loading...</div>;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Visual feedback - the button will briefly change
    };

    // --- RENDER: Credit Card Success State ---
    if (method === 'credit_card' && cardSuccess) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col">
                <Navbar />
                <div className="ui-centered-page relative">
                    <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#737300]/20 to-transparent -z-10" />
                    <Card className="max-w-md w-full bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl text-center p-6">
                        <div className="w-20 h-20 bg-[#8a8a00] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#8a8a00]/50 animate-in zoom-in duration-500">
                            <CheckCircle className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold mb-2">Payment Successful!</h2>
                        <p className="text-gray-400 mb-8">Thank you for your payment via Visa/Mastercard.</p>

                        <div className="bg-white/5 rounded-xl p-4 mb-8 text-sm space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Transaction ID</span>
                                <span className="font-mono">{refNo}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Amount Paid</span>
                                <span className="font-bold text-[#8a8a00]">฿{parseFloat(amount).toLocaleString()}</span>
                            </div>
                        </div>

                        <Link href="/">
                            <Button className="w-full h-12 bg-white text-black hover:bg-gray-200">
                                Return to Home
                            </Button>
                        </Link>
                    </Card>
                </div>
                <Footer />
            </div>
        );
    }

    // --- RENDER: Credit Card Processing State ---
    if (method === 'credit_card') {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col">
                <Navbar />
                <div className="ui-centered-page relative">
                    <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/20 to-transparent -z-10" />
                    <Card className="max-w-md w-full bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-8 text-center">
                        <div className="relative w-24 h-24 mx-auto mb-6">
                            <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                            <CreditCard className="absolute inset-0 m-auto w-8 h-8 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Processing Payment...</h2>
                        <p className="text-gray-400 text-sm mb-6">Communicating with payment gateway securely.</p>

                        <div className="flex items-center justify-center gap-2 text-xs text-blue-300 bg-blue-900/20 py-2 px-4 rounded-full">
                            <ShieldCheck className="w-3 h-3" /> 256-bit SSL Secure Payment
                        </div>
                    </Card>
                </div>
                <Footer />
            </div>
        );
    }

    // --- RENDER: QR Code Payment (Default) ---
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Navbar />

            <div className="ui-centered-page relative">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#737300]/20 to-transparent -z-10" />

                <Card className="max-w-md w-full bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="text-center pb-2">
                        <div className="w-16 h-16 rounded-full bg-[#8a8a00]/20 flex items-center justify-center mx-auto mb-4">
                            <QrCode className="w-8 h-8 text-[#8a8a00]" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Scan to Pay</CardTitle>
                        <p className="text-gray-400 text-sm">Please scan the QR code to complete your registration.</p>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* QR Code Area */}
                        <div className="bg-white p-4 rounded-xl mx-auto w-64 h-64 flex items-center justify-center shadow-inner">
                            {/* Mock QR Code */}
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=PAY-${eventId}-${amount}`}
                                alt="Payment QR Code"
                                className="w-full h-full object-contain"
                            />
                        </div>

                        {/* Amount & Timer */}
                        <div className="text-center space-y-1">
                            <div className="text-sm text-gray-400">Total Amount</div>
                            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#8a8a00] to-[#a0a030]">
                                ฿{parseFloat(amount).toLocaleString()}
                            </div>
                            <div className="flex items-center justify-center gap-2 text-xs text-teal-400 mt-2 bg-teal-900/20 py-1 px-3 rounded-full w-fit mx-auto">
                                <Clock className="w-3 h-3" /> Expires in 14:59
                            </div>
                        </div>

                        {/* Bank Details */}
                        <div className="bg-black/20 rounded-lg p-4 space-y-3 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Bank</span>
                                <span className="font-bold">Kasikorn Bank (K-Bank)</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Account Name</span>
                                <span className="font-bold">Conference System Co., Ltd.</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-white/10">
                                <span className="text-gray-400">Ref. No.</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-[#8a8a00]">{refNo}</span>
                                    <button onClick={() => copyToClipboard(refNo)} className="hover:text-white"><Copy className="w-3 h-3" /></button>
                                </div>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-3">
                        <Button className="w-full bg-[#8a8a00] hover:bg-[#737300] text-white">
                            <Download className="w-4 h-4 mr-2" /> Save QR Code
                        </Button>
                        <Link href="/" className="w-full">
                            <Button variant="outline" className="w-full border-white/10 hover:bg-white/5">
                                I have completed payment <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                        <Link href={`/checkout/${eventId}?round=${roundId}`} className="w-full">
                            <Button variant="ghost" className="w-full text-gray-400 hover:text-white hover:bg-white/5">
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Checkout
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>

            <Footer />
        </div>
    );
}
