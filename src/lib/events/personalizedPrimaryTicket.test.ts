import { describe, expect, it } from 'vitest';
import type { PricingEligibility } from '@/lib/api/pricingEligibility';
import type { TicketType } from '@/types';
import { selectPersonalizedPrimaryTicket } from './personalizedPrimaryTicket';

const earlyBird: TicketType = {
    id: '2',
    name: 'Early Bird',
    ticketCategory: 'primary',
    priority: 'early_bird',
    price: 1250,
    currency: 'THB',
};

const regular: TicketType = {
    id: '3',
    name: 'Regular',
    ticketCategory: 'primary',
    priority: 'regular',
    price: 2500,
    currency: 'THB',
};

function pricing(overrides: Partial<PricingEligibility>): PricingEligibility {
    return {
        eventId: 2,
        policyCode: 'pris2026_abstract_early_bird',
        applies: true,
        phase: 'extended_early_bird',
        qualifiedForExtension: false,
        effectivePriority: 'regular',
        effectiveTicketTypeId: 3,
        offerExpiresAt: null,
        reason: 'account_after_cutoff',
        ...overrides,
    };
}

describe('selectPersonalizedPrimaryTicket', () => {
    it('returns the API-selected Early Bird ticket for an eligible extension account', () => {
        const result = selectPersonalizedPrimaryTicket({
            tickets: [earlyBird, regular],
            pricing: pricing({
                qualifiedForExtension: true,
                effectivePriority: 'early_bird',
                effectiveTicketTypeId: 2,
                offerExpiresAt: '2026-09-15T17:00:00.000Z',
                reason: 'eligible_extension',
            }),
            personalizationRequired: true,
            personalizationReady: true,
        });

        expect(result?.id).toBe('2');
        expect(result?.price).toBe(1250);
    });

    it('returns Regular for an account created after cutoff even when Early Bird is also on sale', () => {
        const result = selectPersonalizedPrimaryTicket({
            tickets: [earlyBird, regular],
            pricing: pricing({
                effectivePriority: 'regular',
                effectiveTicketTypeId: 3,
                reason: 'account_after_cutoff',
            }),
            personalizationRequired: true,
            personalizationReady: true,
        });

        expect(result?.id).toBe('3');
        expect(result?.price).toBe(2500);
    });

    it('keeps generic priority selection when pricing does not apply', () => {
        const result = selectPersonalizedPrimaryTicket({
            tickets: [regular, earlyBird],
            pricing: pricing({
                policyCode: null,
                applies: false,
                phase: 'not_applicable',
                qualifiedForExtension: false,
                effectivePriority: null,
                effectiveTicketTypeId: null,
                offerExpiresAt: null,
                reason: 'not_applicable',
            }),
            personalizationRequired: true,
            personalizationReady: true,
        });

        expect(result?.id).toBe('2');
    });

    it('fails closed while authenticated personalized pricing is unresolved', () => {
        const result = selectPersonalizedPrimaryTicket({
            tickets: [earlyBird, regular],
            pricing: null,
            personalizationRequired: true,
            personalizationReady: false,
        });

        expect(result).toBeNull();
    });

    it('fails closed when an applying policy has no effective ticket id', () => {
        const result = selectPersonalizedPrimaryTicket({
            tickets: [earlyBird, regular],
            pricing: pricing({ effectiveTicketTypeId: null }),
            personalizationRequired: true,
            personalizationReady: true,
        });

        expect(result).toBeNull();
    });
});
