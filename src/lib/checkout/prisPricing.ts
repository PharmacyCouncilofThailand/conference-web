import type { PricingEligibility } from '@/lib/api/pricingEligibility';

export interface PersonalizedPackageResult<T extends { id: string }> {
    packages: T[];
    selectedPackage: string;
    selectionWasInvalidated: boolean;
}

interface PersonalizedPricingInput<T extends { id: string }> {
    packages: T[];
    pricing: PricingEligibility | null;
    selectedPackage: string;
}

export function applyPersonalizedPricing<T extends { id: string }>({
    packages,
    pricing,
    selectedPackage,
}: PersonalizedPricingInput<T>): PersonalizedPackageResult<T> {
    if (!pricing?.applies) {
        return { packages, selectedPackage, selectionWasInvalidated: false };
    }

    const effectiveId = pricing.effectiveTicketTypeId;
    const filtered = effectiveId == null
        ? []
        : packages.filter((pkg) => pkg.id === String(effectiveId));

    const selectedStillValid =
        !selectedPackage || filtered.some((pkg) => pkg.id === selectedPackage);

    return {
        packages: filtered,
        selectedPackage: selectedStillValid ? selectedPackage : '',
        selectionWasInvalidated: !selectedStillValid,
    };
}
