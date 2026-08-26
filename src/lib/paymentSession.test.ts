import { beforeEach, describe, expect, it } from 'vitest';
import { clearPaymentProviderSessionForFreeResult } from './paymentSession';

describe('clearPaymentProviderSessionForFreeResult', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it('preserves checkout redirect context for the result page while clearing provider refs', () => {
        const checkoutContext = JSON.stringify({
            originApp: 'source-app',
            returnTo: 'https://source-app.example.com/return',
            websiteUrl: 'https://source-app.example.com/event',
        });

        sessionStorage.setItem('checkout-payment-data', checkoutContext);
        sessionStorage.setItem('payment-gateway', 'paysolutions');
        sessionStorage.setItem('payment-orderRef', 'ORDER-REF');
        sessionStorage.setItem('payment-refno', 'REFNO');

        clearPaymentProviderSessionForFreeResult(sessionStorage);

        expect(sessionStorage.getItem('checkout-payment-data')).toBe(checkoutContext);
        expect(sessionStorage.getItem('payment-gateway')).toBeNull();
        expect(sessionStorage.getItem('payment-orderRef')).toBeNull();
        expect(sessionStorage.getItem('payment-refno')).toBeNull();
    });
});
