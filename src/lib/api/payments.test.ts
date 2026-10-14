import { afterEach, describe, expect, it, vi } from 'vitest';
import { paymentsApi } from './payments';

const previewRequest = {
    eventId: 2,
    packageId: '1',
    addOnIds: [],
    currency: 'THB' as const,
    paymentMethod: 'card' as const,
    promoCode: 'TESTJA',
};

afterEach(() => {
    vi.restoreAllMocks();
});

describe('paymentsApi.createIntent', () => {
    it('preserves zero-total free checkout without inventing a gateway', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                data: {
                    free: true,
                    gateway: null,
                    redirectForm: null,
                    refno: null,
                    orderRef: null,
                    orderNumber: 'CONF-FREE-1',
                    regCode: 'REG-FREE-1',
                    total: 0,
                },
            }),
        } as Response);

        const result = await paymentsApi.createIntent({
            eventId: 2,
            packageId: '1',
            addOnIds: [],
            currency: 'THB',
            paymentMethod: 'card',
            promoCode: 'FREE100',
            needTaxInvoice: false,
        });

        expect(result.free).toBe(true);
        expect(result.gateway).toBeNull();
        expect(result.redirectForm).toBeNull();
        expect(result.regCode).toBe('REG-FREE-1');
        expect(result.totalAmount).toBe('0');
    });

    it('preserves TICKET_NOT_ELIGIBLE code and status from create-intent', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: false,
            status: 409,
            json: async () => ({
                success: false,
                code: 'TICKET_NOT_ELIGIBLE',
                error: 'Selected ticket is not available for your current PRIS 2026 registration rate',
            }),
        } as Response);

        await expect(paymentsApi.createIntent({
            eventId: 2,
            packageId: '2',
            addOnIds: [],
            currency: 'THB',
            paymentMethod: 'card',
            needTaxInvoice: false,
        })).rejects.toMatchObject({
            code: 'TICKET_NOT_ELIGIBLE',
            status: 409,
        });
    });
});

it('sends no method for free checkout and preserves the server currency', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
            success: true, data: {
                free: true, gateway: null, redirectForm: null, refno: null, orderRef: null,
                orderNumber: 'CONF-FREE-USD', regCode: 'REG-FREE-USD', total: 0, currency: 'USD',
            }
        }),
    } as Response);
    const result = await paymentsApi.createIntent({
        eventId: 2, packageId: '7', addOnIds: [], currency: 'USD', needTaxInvoice: false,
    });
    const body = JSON.parse(String(fetchSpy.mock.calls[0][1]?.body));
    expect(body).not.toHaveProperty('paymentMethod');
    expect(result.currency).toBe('USD');
    expect(result.gateway).toBeNull();
});

describe('paymentsApi.preview', () => {
    it('unwraps the backend data envelope for a valid promo code', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                data: {
                    subtotal: 1000,
                    discountAmount: 100,
                    discountType: 'percentage',
                    discountValue: 10,
                    netAmount: 900,
                    fee: 0,
                    total: 900,
                    currency: 'THB',
                    feeMethod: null,
                    promoValid: true,
                    promoError: null,
                },
            }),
        } as Response);

        const result = await paymentsApi.preview(previewRequest);

        expect(result).toEqual({
            success: true,
            subtotal: 1000,
            discountAmount: 100,
            discountType: 'percentage',
            discountValue: 10,
            netAmount: 900,
            fee: 0,
            total: 900,
            currency: 'THB',
            feeMethod: null,
            promoValid: true,
            promoError: null,
        });
    });

    it('exposes promoError from the backend preview payload', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                data: {
                    subtotal: 1000,
                    discountAmount: 0,
                    discountType: null,
                    discountValue: null,
                    netAmount: 1000,
                    fee: 0,
                    total: 1000,
                    currency: 'THB',
                    feeMethod: null,
                    promoValid: false,
                    promoError: 'Promo code not found',
                },
            }),
        } as Response);

        const result = await paymentsApi.preview({
            ...previewRequest,
            promoCode: 'DOES-NOT-EXIST',
        });

        expect(result.promoValid).toBe(false);
        expect(result.promoError).toBe('Promo code not found');
    });

    it('preserves TICKET_NOT_ELIGIBLE code and status from preview', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: false,
            status: 409,
            json: async () => ({
                success: false,
                code: 'TICKET_NOT_ELIGIBLE',
                error: 'Selected ticket is not available for your current PRIS 2026 registration rate',
            }),
        } as Response);

        await expect(paymentsApi.preview(previewRequest)).rejects.toMatchObject({
            code: 'TICKET_NOT_ELIGIBLE',
            status: 409,
        });
    });
});
