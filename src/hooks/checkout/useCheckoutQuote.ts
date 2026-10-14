'use client';

import { useQuery } from '@tanstack/react-query';
import { paymentsApi, type PreviewRequest, type PreviewResponse } from '@/lib/api/payments';
import type { ApiError } from '@/lib/api/client';

export type CheckoutQuoteState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'ready'; quote: PreviewResponse }
    | { status: 'error'; error: ApiError };

export interface CheckoutQuoteInput {
    accountId: string;
    request: PreviewRequest;
}

export function useCheckoutQuote(input: CheckoutQuoteInput | null) {
    const request = input ? {
        eventId: input.request.eventId,
        packageId: input.request.packageId,
        addOnIds: [...input.request.addOnIds].sort(),
        currency: input.request.currency,
        ...(input.request.promoCode?.trim() ? { promoCode: input.request.promoCode.trim().toUpperCase() } : {}),
    } : null;
    const query = useQuery<PreviewResponse, ApiError>({
        queryKey: ['checkout-quote', input?.accountId ?? null, request],
        enabled: request !== null,
        staleTime: 0,
        refetchOnMount: 'always',
        retry: false,
        queryFn: async () => {
            if (!request) throw new Error('Checkout items are unresolved');
            const quote = await paymentsApi.preview(request);
            if (request.promoCode && !quote.promoValid) {
                const error = new Error(quote.promoError || 'โค้ดส่วนลดไม่ถูกต้อง') as ApiError;
                error.code = 'INVALID_PROMO';
                throw error;
            }
            const amounts = [quote.subtotal, quote.discountAmount, quote.netAmount, quote.fee, quote.total];
            if (!quote.success || quote.currency !== request.currency || amounts.some((amount) => !Number.isFinite(amount) || amount < 0)
                || Math.abs(quote.subtotal - quote.discountAmount - quote.netAmount) > 0.01
                || Math.abs(quote.netAmount + quote.fee - quote.total) > 0.01) {
                throw new Error('Invalid checkout pricing response');
            }
            return quote;
        },
    });
    let state: CheckoutQuoteState;
    if (!input) state = { status: 'idle' };
    else if (query.isFetching || query.isPending) state = { status: 'loading' };
    else if (query.isError) state = { status: 'error', error: query.error };
    else if (query.data) state = { status: 'ready', quote: query.data };
    else state = { status: 'idle' };
    return { state, retry: query.refetch };
}
