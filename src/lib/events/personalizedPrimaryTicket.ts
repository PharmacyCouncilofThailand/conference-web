import type { PricingEligibility } from '@/lib/api/pricingEligibility';
import type { TicketType } from '@/types';
import { computeRemainingTicketQuota } from '@/lib/utils';

interface SelectPersonalizedPrimaryTicketInput {
    tickets: TicketType[];
    pricing: PricingEligibility | null;
    personalizationRequired: boolean;
    personalizationReady: boolean;
}

const PRIORITY_ORDER: Record<string, number> = {
    early_bird: 0,
    regular: 1,
    late: 2,
    onsite: 3,
};

function selectGenericPrimaryTicket(tickets: TicketType[]): TicketType | null {
    if (tickets.length === 0) return null;

    const sorted = [...tickets].sort((a, b) => {
        const aPriority = PRIORITY_ORDER[a.priority || a.category || 'regular'] ?? 99;
        const bPriority = PRIORITY_ORDER[b.priority || b.category || 'regular'] ?? 99;
        return aPriority - bPriority;
    });

    return sorted.find((ticket) => {
        const remaining = computeRemainingTicketQuota(ticket.quota ?? 0, ticket.soldCount ?? 0);
        return remaining === null || remaining === undefined || remaining > 0;
    }) || sorted[0] || null;
}

export function selectPersonalizedPrimaryTicket({
    tickets,
    pricing,
    personalizationRequired,
    personalizationReady,
}: SelectPersonalizedPrimaryTicketInput): TicketType | null {
    if (personalizationRequired && !personalizationReady) {
        return null;
    }

    if (pricing?.applies) {
        if (pricing.effectiveTicketTypeId == null) {
            return null;
        }

        return tickets.find((ticket) => ticket.id === String(pricing.effectiveTicketTypeId)) || null;
    }

    return selectGenericPrimaryTicket(tickets);
}
