import { afterEach, describe, expect, it, vi } from 'vitest';
import { pricingEligibilityApi } from './pricingEligibility';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('pricingEligibilityApi.get', () => {
    it('unwraps personalized pricing eligibility', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                data: {
                    eventId: 2,
                    policyCode: 'pris2026_abstract_early_bird',
                    applies: true,
                    phase: 'extended_early_bird',
                    qualifiedForExtension: true,
                    effectivePriority: 'early_bird',
                    effectiveTicketTypeId: 2,
                    offerExpiresAt: '2026-09-15T17:00:00.000Z',
                    reason: 'eligible_extension',
                },
            }),
        } as Response);

        const result = await pricingEligibilityApi.get(2, 'THB');

        expect(result).toEqual({
            eventId: 2,
            policyCode: 'pris2026_abstract_early_bird',
            applies: true,
            phase: 'extended_early_bird',
            qualifiedForExtension: true,
            effectivePriority: 'early_bird',
            effectiveTicketTypeId: 2,
            offerExpiresAt: '2026-09-15T17:00:00.000Z',
            reason: 'eligible_extension',
        });
    });

    it('preserves not-applicable pricing payload unchanged', async () => {
        const data = {
            eventId: 9,
            policyCode: null,
            applies: false,
            phase: 'not_applicable',
            qualifiedForExtension: false,
            effectivePriority: null,
            effectiveTicketTypeId: null,
            offerExpiresAt: null,
            reason: 'not_applicable',
        } as const;

        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, data }),
        } as Response);

        await expect(pricingEligibilityApi.get(9, 'USD')).resolves.toEqual(data);
    });

    it('preserves approved postgraduate override payload unchanged', async () => {
        const data = {
            eventId: 2,
            policyCode: null,
            applies: false,
            phase: 'not_applicable',
            qualifiedForExtension: false,
            effectivePriority: null,
            effectiveTicketTypeId: null,
            offerExpiresAt: null,
            reason: 'postgraduate_override',
        } as const;

        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, data }),
        } as Response);

        await expect(pricingEligibilityApi.get(2, 'THB')).resolves.toEqual(data);
    });
});
