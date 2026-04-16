'use client';

import { CreditCard, QrCode } from 'lucide-react';

interface PaymentMethodCardProps {
    paymentMethod: 'qr' | 'card';
    onSelect: (method: 'qr' | 'card') => void;
    isThai: boolean;
}

export function PaymentMethodCard({ paymentMethod, onSelect, isThai }: PaymentMethodCardProps) {
    return (
        <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
                {/* QR PromptPay — THB only */}
                {isThai && (
                    <button
                        type="button"
                        onClick={() => onSelect('qr')}
                        className={`border rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-all duration-200 ${
                            paymentMethod === 'qr'
                                ? 'bg-[#8a8a00]/10 border-[#8a8a00] shadow-sm scale-[1.02]'
                                : 'bg-white border-gray-200 hover:border-[#8a8a00]/40 hover:scale-[1.01]'
                        }`}
                    >
                        <QrCode className={`w-8 h-8 ${paymentMethod === 'qr' ? 'text-[#8a8a00]' : 'text-gray-400'}`} />
                        <div className="text-center">
                            <div className={`font-bold text-sm ${paymentMethod === 'qr' ? 'text-gray-900' : 'text-gray-600'}`}>
                                QR PromptPay / Mobile Banking
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">สแกนผ่านแอปธนาคาร</div>
                        </div>
                    </button>
                )}

                {/* Credit/Debit Card */}
                <button
                    type="button"
                    onClick={() => onSelect('card')}
                    className={`border rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-all duration-200 ${
                        paymentMethod === 'card'
                            ? 'bg-[#8a8a00]/10 border-[#8a8a00] shadow-sm scale-[1.02]'
                            : 'bg-white border-gray-200 hover:border-[#8a8a00]/40 hover:scale-[1.01]'
                    } ${!isThai ? 'sm:col-span-2' : ''}`}
                >
                    <CreditCard className={`w-8 h-8 ${paymentMethod === 'card' ? 'text-[#8a8a00]' : 'text-gray-400'}`} />
                    <div className="text-center">
                        <div className={`font-bold text-sm ${paymentMethod === 'card' ? 'text-gray-900' : 'text-gray-600'}`}>
                            Credit / Debit Card
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">Visa, Mastercard, JCB</div>
                    </div>
                </button>
            </div>

            {paymentMethod === 'card' && (
                <div className="p-3 bg-[#8a8a00]/5 border border-[#8a8a00]/10 rounded-lg text-sm text-gray-600 flex items-start gap-2">
                    <div className="mt-0.5 w-2 h-2 rounded-full bg-[#8a8a00] flex-shrink-0" />
                    <span>การชำระเงินผ่านบัตรเครดิตดำเนินการผ่าน Pay Solutions กรุณากรอกข้อมูลบัตรในหน้าต่างถัดไป</span>
                </div>
            )}
        </div>
    );
}
