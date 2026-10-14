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
    // Server-authoritative entitlements; refreshed on checkout entry and never persisted.
    ownedSessionIds: number[];

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
    requestedPromoCode?: string;
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
    ownedSessionIds: [],
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
    requestedPromoCode: '',
};

const STEPS = [
    { id: 1, label: 'ข้อมูลส่วนตัว' },
    { id: 2, label: 'เลือกแพ็กเกจ' },
    { id: 3, label: 'ใบกำกับภาษี' },
    { id: 4, label: 'วิธีชำระเงิน' },
] as const;

export interface CheckoutFlow {
    quoteReady: boolean;
    isFree: boolean;
}

export const FREE_CHECKOUT_DATA = {
    needTaxInvoice: false,
    taxName: '', taxId: '', taxAddress: '', taxSubDistrict: '', taxDistrict: '', taxProvince: '', taxPostalCode: '',
    paymentMethod: null,
} satisfies Partial<CheckoutData>;

export function useCheckoutWizard(eventId: string) {
    const storageKey = `checkout-wizard-${eventId}`;
    const [currentStep, setCurrentStep] = useState(1);
    const [checkoutData, setCheckoutData] = useState<CheckoutData>(INITIAL_CHECKOUT_DATA);
    const [restoredStorageKey, setRestoredStorageKey] = useState<string | null>(null);
    const isRestored = restoredStorageKey === storageKey;

    useEffect(() => {
        let cancelled = false;
        queueMicrotask(() => {
            if (cancelled) return;
            let data = INITIAL_CHECKOUT_DATA;
            let step = 1;
            try {
                const saved = sessionStorage.getItem(storageKey);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.checkoutData) data = { ...INITIAL_CHECKOUT_DATA, ...parsed.checkoutData, ownedSessionIds: [] };
                    if (Number.isInteger(parsed.currentStep) && parsed.currentStep >= 1 && parsed.currentStep <= 4) step = parsed.currentStep;
                }
            } catch {
                data = INITIAL_CHECKOUT_DATA;
            }
            setCheckoutData(data);
            setCurrentStep(step);
            setRestoredStorageKey(storageKey);
        });
        return () => { cancelled = true; };
    }, [storageKey]);

    useEffect(() => {
        if (!isRestored) return;
        try {
            const persisted = Object.fromEntries(Object.entries(checkoutData).filter(([key]) => key !== 'ownedSessionIds'));
            sessionStorage.setItem(storageKey, JSON.stringify({ checkoutData: persisted, currentStep }));
        } catch {
            // The payment submission path reports storage errors before navigation.
        }
    }, [checkoutData, currentStep, isRestored, storageKey]);

    const updateCheckoutData = useCallback((updates: Partial<CheckoutData>) => {
        setCheckoutData((prev) => ({ ...prev, ...updates }));
    }, []);
    const isStep1Valid = useCallback(() => {
        const { firstName, lastName, email, phone } = checkoutData;
        return Boolean(firstName.trim() && lastName.trim() && email.trim() && phone.trim());
    }, [checkoutData]);
    const isStep2Valid = useCallback(() => checkoutData.isAddonOnly
        ? checkoutData.selectedAddOns.length > 0 : Boolean(checkoutData.selectedPackage), [checkoutData]);
    const isStep3Valid = useCallback((flow: CheckoutFlow) => {
        if (flow.isFree || !checkoutData.needTaxInvoice) return true;
        const { taxName, taxId, taxAddress, taxSubDistrict, taxDistrict, taxProvince, taxPostalCode } = checkoutData;
        return Boolean(taxName.trim() && /^\d{13}$/.test(taxId) && taxAddress.trim()
            && taxSubDistrict.trim() && taxDistrict.trim() && taxProvince.trim() && /^\d{5}$/.test(taxPostalCode));
    }, [checkoutData]);
    const isStep4Valid = useCallback((flow: CheckoutFlow) => flow.quoteReady
        && (flow.isFree || checkoutData.paymentMethod === 'qr' || checkoutData.paymentMethod === 'card'), [checkoutData.paymentMethod]);
    const isCurrentStepValid = useCallback((flow: CheckoutFlow) => {
        if (!isRestored) return false;
        switch (currentStep) {
            case 1: return isStep1Valid();
            case 2: return flow.quoteReady && isStep2Valid();
            case 3: return flow.quoteReady && isStep3Valid(flow);
            case 4: return isStep4Valid(flow);
            default: return false;
        }
    }, [currentStep, isRestored, isStep1Valid, isStep2Valid, isStep3Valid, isStep4Valid]);
    const canProceedToPayment = useCallback((flow: CheckoutFlow) => isRestored && flow.quoteReady
        && isStep1Valid() && isStep2Valid() && isStep3Valid(flow) && isStep4Valid(flow),
        [isRestored, isStep1Valid, isStep2Valid, isStep3Valid, isStep4Valid]);
    const getSteps = useCallback((flow: CheckoutFlow) => STEPS.filter((step) => !flow.isFree || step.id !== 3)
        .map((step) => ({ id: step.id, label: step.id === 4 && flow.isFree ? 'ยืนยันการลงทะเบียน' : step.label })), []);

    const nextStep = useCallback((flow: CheckoutFlow) => {
        if (!isCurrentStepValid(flow)) return;
        const next = currentStep === 2 && flow.isFree ? 4 : Math.min(currentStep + 1, 4);
        if (next === 4 && currentStep !== 4) setCheckoutData((prev) => ({ ...prev, paymentMethod: null }));
        setCurrentStep(next);
    }, [currentStep, isCurrentStepValid]);
    const prevStep = useCallback((flow: CheckoutFlow) => {
        setCurrentStep((prev) => prev === 4 && (flow.isFree || !flow.quoteReady) ? 2 : Math.max(prev - 1, 1));
    }, []);
    const goToStep = useCallback((step: number, flow: CheckoutFlow) => {
        if (step >= 1 && step <= 4 && (!flow.isFree || step !== 3)) setCurrentStep(step);
    }, []);
    const resetWizard = useCallback(() => {
        setCheckoutData(INITIAL_CHECKOUT_DATA);
        setCurrentStep(1);
        sessionStorage.removeItem(storageKey);
    }, [storageKey]);

    return {
        currentStep, checkoutData, isRestored, getSteps, updateCheckoutData, nextStep, prevStep, goToStep, resetWizard,
        isCurrentStepValid, canProceedToPayment, isStep1Valid, isStep2Valid, isStep3Valid, isStep4Valid,
    };
}
