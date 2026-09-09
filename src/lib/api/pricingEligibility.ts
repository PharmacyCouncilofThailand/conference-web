import { api } from './client';

export type PricingPhase =
    | 'original_early_bird'
    | 'extended_early_bird'
    | 'regular'
    | 'not_applicable';

export type PricingEligibilityReason =
    | 'original_window'
    | 'eligible_extension'
    | 'account_after_cutoff'
    | 'no_qualifying_abstract'
    | 'offer_expired'
    | 'postgraduate_override'
    | 'not_applicable';

export interface PricingEligibility {
    eventId: number;
    policyCode: 'pris2026_abstract_early_bird' | null;
    applies: boolean;
    phase: PricingPhase;
    qualifiedForExtension: boolean;
    effectivePriority: 'early_bird' | 'regular' | null;
    effectiveTicketTypeId: number | null;
    offerExpiresAt: string | null;
    reason: PricingEligibilityReason;
}

interface PricingEligibilityApiResponse {
    success: true;
    data: PricingEligibility;
}

export const pricingEligibilityApi = {
    get: async (eventId: number, currency: 'THB' | 'USD'): Promise<PricingEligibility> => {
        const params = new URLSearchParams({
            eventId: String(eventId),
            currency,
        });
        const response = await api.get<PricingEligibilityApiResponse>(
            `/api/tickets/pricing-eligibility?${params.toString()}`,
        );
        return response.data;
    },
};
