'use client';

import { useState, useCallback, useEffect } from 'react';

export interface CheckoutData {
    // Step 1: ข้อมูลส่วนตัว
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    country: string;

    // Step 2: Package + Add-ons
    selectedPackage: string;
    selectedAddOns: string[];

    // Add-on details
    dietaryRequirement: string;
    dietaryOtherText: string;
    selectedWorkshopTopic?: string;
    selectedOptionalSessions: string[];

    // Addon-only mode
    isAddonOnly?: boolean;
    purchasedAddOns?: string[];

    // Step 3: Tax Invoice
    needTaxInvoice: boolean;
    taxName: string;
    taxId: string;
    taxAddress: string;
    taxSubDistrict: string;
    taxDistrict: string;
    taxProvince: string;
    taxPostalCode: string;

    // Step 4: Payment Method (null = ยังไม่เลือก)
    paymentMethod: 'qr' | 'card' | null;

    // Currency (auto-detect from user.delegateType)
    currency?: 'THB' | 'USD';

    // Promo Code
    promoCode: string;
    promoApplied: boolean;
}

const INITIAL_CHECKOUT_DATA: CheckoutData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    selectedPackage: '',
    selectedAddOns: [],
    dietaryRequirement: '',
    dietaryOtherText: '',
    selectedWorkshopTopic: undefined,
    selectedOptionalSessions: [],
    isAddonOnly: false,
    purchasedAddOns: [],
    needTaxInvoice: false,
    taxName: '',
    taxId: '',
    taxAddress: '',
    taxSubDistrict: '',
    taxDistrict: '',
    taxProvince: '',
    taxPostalCode: '',
    paymentMethod: null,
    currency: 'THB',
    promoCode: '',
    promoApplied: false,
};

const STEPS = [
    { id: 1, label: 'ข้อมูลส่วนตัว' },
    { id: 2, label: 'เลือกแพ็กเกจ' },
    { id: 3, label: 'ใบกำกับภาษี' },
    { id: 4, label: 'วิธีชำระเงิน' },
] as const;

export function useCheckoutWizard(eventId: string) {
    const storageKey = `checkout-wizard-${eventId}`;
    const [currentStep, setCurrentStep] = useState(1);
    const [checkoutData, setCheckoutData] = useState<CheckoutData>(INITIAL_CHECKOUT_DATA);

    // Restore from sessionStorage on mount
    useEffect(() => {
        try {
            const saved = sessionStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.checkoutData) {
                    setCheckoutData(parsed.checkoutData);
                }
                if (parsed.currentStep) {
                    setCurrentStep(parsed.currentStep);
                }
            }
        } catch {
            // ignore parse errors
        }
    }, [storageKey]);

    // Persist to sessionStorage on change
    useEffect(() => {
        try {
            sessionStorage.setItem(storageKey, JSON.stringify({
                checkoutData,
                currentStep,
            }));
        } catch {
            // ignore storage errors
        }
    }, [checkoutData, currentStep, storageKey]);

    const updateCheckoutData = useCallback((updates: Partial<CheckoutData>) => {
        setCheckoutData(prev => ({ ...prev, ...updates }));
    }, []);

    const nextStep = useCallback(() => {
        setCurrentStep((prev) => {
            const next = Math.min(prev + 1, STEPS.length);
            // เข้าขั้นตอนที่ 4 จากขั้นที่ 3 — บังคับเลือกวิธีชำระใหม่ทุกครั้ง
            if (next === 4 && prev === 3) {
                setCheckoutData((d) => ({ ...d, paymentMethod: null }));
            }
            return next;
        });
    }, []);

    const prevStep = useCallback(() => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    }, []);

    const goToStep = useCallback((step: number) => {
        if (step >= 1 && step <= STEPS.length) {
            setCurrentStep(step);
        }
    }, []);

    const resetWizard = useCallback(() => {
        setCheckoutData(INITIAL_CHECKOUT_DATA);
        setCurrentStep(1);
        sessionStorage.removeItem(storageKey);
    }, [storageKey]);

    // Validation per step
    const isStep1Valid = useCallback(() => {
        const { firstName, lastName, email, phone } = checkoutData;
        return !!firstName.trim() && !!lastName.trim() && !!email.trim() && !!phone.trim();
    }, [checkoutData]);

    const isStep2Valid = useCallback(() => {
        if (checkoutData.isAddonOnly) {
            return checkoutData.selectedAddOns.length > 0;
        }
        return !!checkoutData.selectedPackage;
    }, [checkoutData]);

    const isStep3Valid = useCallback(() => {
        if (!checkoutData.needTaxInvoice) return true;
        const { taxName, taxId, taxAddress, taxSubDistrict, taxDistrict, taxProvince, taxPostalCode } = checkoutData;
        return !!taxName.trim() && !!taxId.trim() && !!taxAddress.trim() &&
            !!taxSubDistrict.trim() && !!taxDistrict.trim() && !!taxProvince.trim() && !!taxPostalCode.trim();
    }, [checkoutData]);

    const isStep4Valid = useCallback(() => {
        return checkoutData.paymentMethod === 'qr' || checkoutData.paymentMethod === 'card';
    }, [checkoutData.paymentMethod]);

    const isCurrentStepValid = useCallback(() => {
        switch (currentStep) {
            case 1: return isStep1Valid();
            case 2: return isStep2Valid();
            case 3: return isStep3Valid();
            case 4: return isStep4Valid();
            default: return false;
        }
    }, [currentStep, isStep1Valid, isStep2Valid, isStep3Valid, isStep4Valid]);

    const canProceedToPayment = useCallback(() => {
        return isStep1Valid() && isStep2Valid() && isStep3Valid() && isStep4Valid();
    }, [isStep1Valid, isStep2Valid, isStep3Valid, isStep4Valid]);

    return {
        currentStep,
        checkoutData,
        steps: STEPS,
        updateCheckoutData,
        nextStep,
        prevStep,
        goToStep,
        resetWizard,
        isCurrentStepValid,
        canProceedToPayment,
        isStep1Valid,
        isStep2Valid,
        isStep3Valid,
        isStep4Valid,
    };
}
