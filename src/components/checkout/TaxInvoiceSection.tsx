'use client';

import { FileText } from 'lucide-react';

interface TaxInvoiceSectionProps {
    needTaxInvoice: boolean;
    onNeedTaxInvoiceChange: (value: boolean) => void;
    taxName: string;
    taxId: string;
    taxAddress: string;
    taxSubDistrict: string;
    taxDistrict: string;
    taxProvince: string;
    taxPostalCode: string;
    onFieldChange: (field: string, value: string) => void;
}

export function TaxInvoiceSection({
    needTaxInvoice,
    onNeedTaxInvoiceChange,
    taxName,
    taxId,
    taxAddress,
    taxSubDistrict,
    taxDistrict,
    taxProvince,
    taxPostalCode,
    onFieldChange,
}: TaxInvoiceSectionProps) {
    return (
        <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer group">
                <input
                    type="checkbox"
                    checked={needTaxInvoice}
                    onChange={(e) => onNeedTaxInvoiceChange(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-[#8a8a00] focus:ring-[#8a8a00]"
                />
                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500 group-hover:text-[#8a8a00] transition-colors" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                        ต้องการใบกำกับภาษี
                    </span>
                </div>
            </label>

            {needTaxInvoice && (
                <div className="space-y-4 pl-8 border-l-2 border-[#8a8a00]/20">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">ชื่อ / บริษัท <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={taxName}
                                onChange={(e) => onFieldChange('taxName', e.target.value)}
                                placeholder="ชื่อบุคคล หรือ ชื่อบริษัท"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-[#8a8a00] focus:ring-1 focus:ring-[#8a8a00] outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">เลขประจำตัวผู้เสียภาษี <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={taxId}
                                onChange={(e) => onFieldChange('taxId', e.target.value)}
                                placeholder="เลข 13 หลัก"
                                maxLength={13}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-[#8a8a00] focus:ring-1 focus:ring-[#8a8a00] outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">ที่อยู่ <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={taxAddress}
                            onChange={(e) => onFieldChange('taxAddress', e.target.value)}
                            placeholder="เลขที่ อาคาร ซอย ถนน"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-[#8a8a00] focus:ring-1 focus:ring-[#8a8a00] outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">แขวง/ตำบล <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={taxSubDistrict}
                                onChange={(e) => onFieldChange('taxSubDistrict', e.target.value)}
                                placeholder="แขวง/ตำบล"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-[#8a8a00] focus:ring-1 focus:ring-[#8a8a00] outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">เขต/อำเภอ <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={taxDistrict}
                                onChange={(e) => onFieldChange('taxDistrict', e.target.value)}
                                placeholder="เขต/อำเภอ"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-[#8a8a00] focus:ring-1 focus:ring-[#8a8a00] outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">จังหวัด <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={taxProvince}
                                onChange={(e) => onFieldChange('taxProvince', e.target.value)}
                                placeholder="จังหวัด"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-[#8a8a00] focus:ring-1 focus:ring-[#8a8a00] outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">รหัสไปรษณีย์ <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={taxPostalCode}
                                onChange={(e) => onFieldChange('taxPostalCode', e.target.value)}
                                placeholder="10xxx"
                                maxLength={5}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:border-[#8a8a00] focus:ring-1 focus:ring-[#8a8a00] outline-none"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
