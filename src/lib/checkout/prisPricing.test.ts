import { describe, expect, it } from 'vitest';
import type { PricingEligibility } from '@/lib/api/pricingEligibility';
import { applyPersonalizedPricing } from './prisPricing';

const packages = [
    { id: '2', name: 'Early Bird' },
    { id: '3', name: 'Regular' },
];

function pricing(overrides: Partial<PricingEligibility> = {}): PricingEligibility {
    return {
        eventId: 2,
        policyCode: 'pris2026_abstract_early_bird',
        applies: true,
        phase: 'extended_early_bird',
        qualifiedForExtension: true,
        effectivePriority: 'early_bird',
        effectiveTicketTypeId: 2,
        offerExpiresAt: '2026-09-15T17:00:00.000Z',
        reason: 'eligible_extension',
        ...overrides,
    };
}

describe('applyPersonalizedPricing', () => {
    it('keeps generic packages when policy does not apply', () => {
        const result = applyPersonalizedPricing({
            packages,
            pricing: pricing({ applies: false, policyCode: null, phase: 'not_applicable', effectivePriority: null, effectiveTicketTypeId: null, reason: 'not_applicable' }),
            selectedPackage: '3',
        });

        expect(result.packages).toEqual(packages);
        expect(result.selectedPackage).toBe('3');
        expect(result.selectionWasInvalidated).toBe(false);
    });

    it('shows only the effective Early Bird package', () => {
        expect(applyPersonalizedPricing({ packages, pricing: pricing(), selectedPackage: '' }).packages)
            .toEqual([{ id: '2', name: 'Early Bird' }]);
    });

    it('shows only the effective Regular package', () => {
        expect(applyPersonalizedPricing({
            packages,
            pricing: pricing({ effectiveTicketTypeId: 3, effectivePriority: 'regular', qualifiedForExtension: false, reason: 'no_qualifying_abstract' }),
            selectedPackage: '',
        }).packages).toEqual([{ id: '3', name: 'Regular' }]);
    });

    it('clears a stale Regular selection when Early Bird is effective', () => {
        const result = applyPersonalizedPricing({ packages, pricing: pricing(), selectedPackage: '3' });
        expect(result.selectedPackage).toBe('');
        expect(result.selectionWasInvalidated).toBe(true);
    });

    it('keeps an effective selected package', () => {
        const result = applyPersonalizedPricing({ packages, pricing: pricing(), selectedPackage: '2' });
        expect(result.selectedPackage).toBe('2');
        expect(result.selectionWasInvalidated).toBe(false);
    });

    it('fails closed when policy applies without an effective ticket id', () => {
        const result = applyPersonalizedPricing({
            packages,
            pricing: pricing({ effectiveTicketTypeId: null, effectivePriority: null }),
            selectedPackage: '2',
        });
        expect(result.packages).toEqual([]);
        expect(result.selectedPackage).toBe('');
        expect(result.selectionWasInvalidated).toBe(true);
    });

    it('clears persisted Early Bird when API now resolves Regular', () => {
        const result = applyPersonalizedPricing({
            packages,
            pricing: pricing({ effectiveTicketTypeId: 3, effectivePriority: 'regular', qualifiedForExtension: false, reason: 'offer_expired' }),
            selectedPackage: '2',
        });
        expect(result.selectedPackage).toBe('');
        expect(result.selectionWasInvalidated).toBe(true);
    });

    it.each([
        ['original_window', 2, ['2']],
        ['eligible_extension', 2, ['2']],
        ['no_qualifying_abstract', 3, ['3']],
        ['account_after_cutoff', 3, ['3']],
        ['offer_expired', 3, ['3']],
    ] as const)('uses API decision %s without re-evaluating policy', (reason, effectiveTicketTypeId, expectedIds) => {
        const result = applyPersonalizedPricing({
            packages,
            pricing: pricing({
                reason,
                effectiveTicketTypeId,
                effectivePriority: effectiveTicketTypeId === 2 ? 'early_bird' : 'regular',
                qualifiedForExtension: reason === 'eligible_extension',
                phase: reason === 'original_window'
                    ? 'original_early_bird'
                    : effectiveTicketTypeId === 2
                        ? 'extended_early_bird'
                        : 'regular',
            }),
            selectedPackage: '',
        });

        expect(result.packages.map((pkg) => pkg.id)).toEqual(expectedIds);
    });

    it('keeps generic packages for not_applicable API decision', () => {
        const result = applyPersonalizedPricing({
            packages,
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
            selectedPackage: '',
        });

        expect(result.packages.map((pkg) => pkg.id)).toEqual(['2', '3']);
    });
});
