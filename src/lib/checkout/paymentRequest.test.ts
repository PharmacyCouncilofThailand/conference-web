import { describe, expect, it } from 'vitest';
import { buildCreateIntentRequest, isCheckoutRecoveryError, type CheckoutPaymentData } from './paymentRequest';

const data: CheckoutPaymentData = {
    eventId: '2', quotedTotal: 0, currency: 'USD',
    originApp: 'pris2026', returnTo: 'https://event.example.test', websiteUrl: 'https://event.example.test',
    firstName: 'Test', lastName: 'User', email: 'test@example.test', phone: '0800000000', country: 'US',
    selectedPackage: '7', selectedAddOns: ['workshop'], selectedWorkshopTopic: '11',
    selectedOptionalSessions: ['12'], ownedSessionIds: [], isAddonOnly: false, purchasedAddOns: [],
    dietaryRequirement: 'other', dietaryOtherText: 'Vegetarian',
    paymentMethod: 'card', promoCode: 'FREE100', promoApplied: true,
    needTaxInvoice: true, taxName: 'Old Tax', taxId: '1234567890123', taxAddress: 'Old Address',
    taxSubDistrict: 'Old', taxDistrict: 'Old', taxProvince: 'Old', taxPostalCode: '10100',
};

describe('checkout request boundary', () => {
    it('omits method, tax fields, quoted amount and return context for a free request', () => {
        expect(buildCreateIntentRequest(data)).toEqual({
            eventId: 2, packageId: '7', addOnIds: ['workshop'], currency: 'USD',
            promoCode: 'FREE100', workshopSessionId: 11, optionalSessionIds: [12],
            dietaryRequirement: 'Vegetarian', needTaxInvoice: false,
        });
    });
    it('requires an explicit method for a positive quoted total', () => {
        expect(() => buildCreateIntentRequest({ ...data, quotedTotal: 500, paymentMethod: null })).toThrow(/payment method/i);
    });
    it('preserves paid tax fields and a selected QR method', () => {
        const request = buildCreateIntentRequest({ ...data, quotedTotal: 500, currency: 'THB', paymentMethod: 'qr' });
        expect(request.paymentMethod).toBe('qr');
        expect(request.needTaxInvoice).toBe(true);
        expect(request.taxId).toBe(data.taxId);
    });
    it('supports addon-only and sends only applied codes', () => {
        const request = buildCreateIntentRequest({ ...data, isAddonOnly: true, promoApplied: false });
        expect(request.packageId).toBe('');
        expect(request).not.toHaveProperty('promoCode');
    });
    it('rejects unresolved legacy or malformed stored quotes', () => {
        for (const quotedTotal of [undefined, null, -1, NaN, Infinity]) {
            expect(() => buildCreateIntentRequest({ ...data, quotedTotal } as CheckoutPaymentData)).toThrow(/quote/i);
        }
        expect(() => buildCreateIntentRequest({ ...data, eventId: 'invalid' })).toThrow(/event/i);
    });
    it('recognizes pricing and promo recovery without treating network failures as retry-safe', () => {
        for (const code of ['PAYMENT_METHOD_REQUIRED', 'FREE_TOTAL_CHANGED', 'PROMO_CHECKOUT_CHANGED', 'INVALID_PROMO', 'PROMO_USER_LIMIT_REACHED', 'PROMO_USAGE_LIMIT_REACHED']) {
            expect(isCheckoutRecoveryError(code)).toBe(true);
        }
        expect(isCheckoutRecoveryError(undefined)).toBe(false);
    });
});
