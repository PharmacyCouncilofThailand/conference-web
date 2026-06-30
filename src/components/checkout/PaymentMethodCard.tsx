'use client';

const PAYSO_CARD_LOGO =
    'https://s3-payso-images.s3.ap-southeast-1.amazonaws.com/image-logocode/credit-1.png';
const PAYSO_PROMPTPAY_LOGO =
    'https://s3-payso-images.s3.ap-southeast-1.amazonaws.com/image-logocode/PromptPay-1.png';

interface PaymentMethodCardProps {
    paymentMethod: 'qr' | 'card' | null;
    onSelect: (method: 'qr' | 'card') => void;
    isThai: boolean;
}

function PaySolutionsLogo({
    src,
    alt,
    selected,
}: {
    src: string;
    alt: string;
    selected: boolean;
}) {
    return (
        <div
            className={`flex w-full items-center justify-center rounded-lg border px-5 py-6 min-h-[7.5rem] transition-colors ${
                selected
                    ? 'bg-white border-[#8a8a00]/20 shadow-sm'
                    : 'bg-gray-50 border-gray-100'
            }`}
        >
            <img
                src={src}
                alt={alt}
                className="w-full h-auto max-h-[5.5rem] object-contain"
                loading="lazy"
            />
        </div>
    );
}

export function PaymentMethodCard({ paymentMethod, onSelect, isThai }: PaymentMethodCardProps) {
    return (
        <div className="space-y-3">
            {!paymentMethod && (
                <p className="text-sm text-gray-500">กรุณาเลือกวิธีชำระเงิน</p>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
                {/* QR PromptPay — THB only */}
                {isThai && (
                    <button
                        type="button"
                        onClick={() => onSelect('qr')}
                        className={`border rounded-xl p-5 flex flex-col items-stretch gap-4 transition-all duration-200 ${
                            paymentMethod === 'qr'
                                ? 'bg-[#8a8a00]/10 border-[#8a8a00] shadow-sm scale-[1.02]'
                                : 'bg-white border-gray-200 hover:border-[#8a8a00]/40 hover:scale-[1.01]'
                        }`}
                    >
                        <PaySolutionsLogo
                            src={PAYSO_PROMPTPAY_LOGO}
                            alt="PromptPay"
                            selected={paymentMethod === 'qr'}
                        />
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
                    className={`border rounded-xl p-5 flex flex-col items-stretch gap-4 transition-all duration-200 ${
                        paymentMethod === 'card'
                            ? 'bg-[#8a8a00]/10 border-[#8a8a00] shadow-sm scale-[1.02]'
                            : 'bg-white border-gray-200 hover:border-[#8a8a00]/40 hover:scale-[1.01]'
                    } ${!isThai ? 'sm:col-span-2' : ''}`}
                >
                    <PaySolutionsLogo
                        src={PAYSO_CARD_LOGO}
                        alt="Credit / Debit Card"
                        selected={paymentMethod === 'card'}
                    />
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
