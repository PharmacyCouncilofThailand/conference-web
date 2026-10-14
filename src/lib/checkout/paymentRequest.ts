import type { CheckoutData } from '@/hooks/checkout/useCheckoutWizard';
import type { CreateIntentRequest } from '@/lib/api/payments';

export interface CheckoutPaymentData extends CheckoutData {
    eventId: string;
    quotedTotal: number;
    currency: 'THB' | 'USD';
    originApp?: string | null;
    returnTo?: string | null;
    websiteUrl?: string | null;
}

export function buildCreateIntentRequest(data: CheckoutPaymentData): CreateIntentRequest {
    const eventId = Number(data.eventId);
    if (!Number.isInteger(eventId) || eventId <= 0) throw new Error('Invalid event context for checkout');
    if (typeof data.quotedTotal !== 'number' || !Number.isFinite(data.quotedTotal) || data.quotedTotal < 0) {
        throw Object.assign(new Error('Checkout quote must be refreshed'), { code: 'CHECKOUT_DATA_STALE' });
    }
    if (data.currency !== 'THB' && data.currency !== 'USD') throw new Error('Invalid checkout currency');
    const isFree = data.quotedTotal === 0;
    if (!isFree && data.paymentMethod !== 'qr' && data.paymentMethod !== 'card') {
        throw new Error('Please select a payment method');
    }
    const workshopSessionId = Number(data.selectedWorkshopTopic);
    const optionalSessionIds = data.selectedOptionalSessions
        .map(Number).filter((id) => Number.isInteger(id) && id > 0);
    const needTaxInvoice = !isFree && data.needTaxInvoice;
    return {
        eventId,
        packageId: data.isAddonOnly ? '' : data.selectedPackage,
        addOnIds: data.selectedAddOns,
        currency: data.currency,
        ...(!isFree ? { paymentMethod: data.paymentMethod as 'qr' | 'card' } : {}),
        ...(data.promoApplied && data.promoCode.trim() ? { promoCode: data.promoCode.trim() } : {}),
        ...(Number.isInteger(workshopSessionId) && workshopSessionId > 0 ? { workshopSessionId } : {}),
        ...(optionalSessionIds.length ? { optionalSessionIds } : {}),
        ...(data.dietaryRequirement ? {
            dietaryRequirement: data.dietaryRequirement === 'other' ? data.dietaryOtherText : data.dietaryRequirement,
        } : {}),
        needTaxInvoice,
        ...(needTaxInvoice ? {
            taxName: data.taxName, taxId: data.taxId, taxAddress: data.taxAddress,
            taxSubDistrict: data.taxSubDistrict, taxDistrict: data.taxDistrict,
            taxProvince: data.taxProvince, taxPostalCode: data.taxPostalCode,
        } : {}),
    };
}

export function isCheckoutRecoveryError(code?: string): boolean {
    return code === 'CHECKOUT_DATA_STALE'
        || code === 'PAYMENT_METHOD_REQUIRED'
        || code === 'FREE_TOTAL_CHANGED'
        || code === 'PROMO_CHECKOUT_CHANGED'
        || code === 'INVALID_PROMO'
        || Boolean(code?.startsWith('PROMO_'));
}
