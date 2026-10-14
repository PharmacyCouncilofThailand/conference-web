import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { paymentsApi, type PreviewResponse } from '@/lib/api/payments';
import { useCheckoutQuote, type CheckoutQuoteInput } from './useCheckoutQuote';

const quote = (total: number, promoValid = false): PreviewResponse => ({
    success: true, subtotal: 500, discountAmount: 500 - total,
    discountType: total < 500 ? 'percentage' : null, discountValue: total < 500 ? 100 : null,
    netAmount: total, fee: 0, total, currency: 'THB', feeMethod: null, promoValid, promoError: null,
});
const input: CheckoutQuoteInput = {
    accountId: '1', request: { eventId: 2, packageId: '7', addOnIds: [], currency: 'THB', promoCode: 'FREE100' },
};
const clients: QueryClient[] = [];
const wrapper = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    clients.push(client);
    return function Wrapper({ children }: { children: ReactNode }) {
        return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    };
};
afterEach(() => { clients.splice(0).forEach((client) => client.clear()); vi.restoreAllMocks(); });

it.each([NaN, Infinity, -1])('rejects an invalid API total %s instead of classifying it as free', async (total) => {
    vi.spyOn(paymentsApi, 'preview').mockResolvedValue({ ...quote(0, true), total });
    const { result } = renderHook(() => useCheckoutQuote(input), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.state.status).toBe('error'));
    expect(result.current.state).not.toHaveProperty('quote');
});

describe('server-authoritative checkout quote', () => {
    it('does not classify unresolved or empty checkout as free', () => {
        const preview = vi.spyOn(paymentsApi, 'preview');
        const { result } = renderHook(() => useCheckoutQuote(null), { wrapper: wrapper() });
        expect(result.current.state.status).toBe('idle');
        expect(preview).not.toHaveBeenCalled();
    });
    it('blocks invalid promos even when preview returns a positive total', async () => {
        vi.spyOn(paymentsApi, 'preview').mockResolvedValue({ ...quote(500), promoError: 'Code expired' });
        const { result } = renderHook(() => useCheckoutQuote(input), { wrapper: wrapper() });
        await waitFor(() => expect(result.current.state.status).toBe('error'));
        expect(result.current.state).not.toHaveProperty('quote');
    });
    it('ignores a delayed zero result after the cart identity changes', async () => {
        let resolveOld!: (value: PreviewResponse) => void;
        const oldRequest = new Promise<PreviewResponse>((resolve) => { resolveOld = resolve; });
        vi.spyOn(paymentsApi, 'preview').mockReturnValueOnce(oldRequest).mockResolvedValueOnce(quote(500));
        const { result, rerender } = renderHook(({ value }) => useCheckoutQuote(value), {
            initialProps: { value: input }, wrapper: wrapper(),
        });
        rerender({ value: { ...input, request: { ...input.request, packageId: '8', promoCode: undefined } } });
        expect(result.current.state.status).toBe('loading');
        await waitFor(() => expect(result.current.state.status).toBe('ready'));
        await act(async () => resolveOld(quote(0, true)));
        const state = result.current.state;
        expect(state.status === 'ready' && state.quote.total).toBe(500);
    });
    it('does not expose cached zero as ready during a refresh', async () => {
        let resolveRefresh!: (value: PreviewResponse) => void;
        vi.spyOn(paymentsApi, 'preview').mockResolvedValueOnce(quote(0, true))
            .mockImplementationOnce(() => new Promise((resolve) => { resolveRefresh = resolve; }));
        const { result } = renderHook(() => useCheckoutQuote(input), { wrapper: wrapper() });
        await waitFor(() => expect(result.current.state.status).toBe('ready'));
        let refresh!: Promise<unknown>;
        act(() => { refresh = result.current.retry(); });
        await waitFor(() => expect(result.current.state.status).toBe('loading'));
        await act(async () => { resolveRefresh(quote(0, true)); await refresh; });
        await waitFor(() => expect(result.current.state.status).toBe('ready'));
    });
    it('blocks malformed pricing and currency mismatches', async () => {
        vi.spyOn(paymentsApi, 'preview').mockResolvedValue({ ...quote(0, true), currency: 'USD' });
        const { result } = renderHook(() => useCheckoutQuote(input), { wrapper: wrapper() });
        await waitFor(() => expect(result.current.state.status).toBe('error'));
    });
});
it('changes account identity without retaining a ready quote', async () => {
    let resolveNext!: (value: PreviewResponse) => void;
    const preview = vi.spyOn(paymentsApi, 'preview').mockResolvedValueOnce(quote(0, true))
        .mockImplementationOnce(() => new Promise((resolve) => { resolveNext = resolve; }));
    const { result, rerender } = renderHook(({ value }) => useCheckoutQuote(value), {
        initialProps: { value: input }, wrapper: wrapper(),
    });
    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    rerender({ value: { ...input, accountId: '2' } });
    expect(result.current.state.status).toBe('loading');
    await waitFor(() => expect(preview).toHaveBeenCalledTimes(2));
    await act(async () => resolveNext(quote(0, true)));
    await waitFor(() => expect(result.current.state.status).toBe('ready'));
});

it('revalidates currency rather than displaying the previous zero quote', async () => {
    let resolveNext!: (value: PreviewResponse) => void;
    const preview = vi.spyOn(paymentsApi, 'preview').mockResolvedValueOnce(quote(0, true))
        .mockImplementationOnce(() => new Promise((resolve) => { resolveNext = resolve; }));
    const { result, rerender } = renderHook(({ value }) => useCheckoutQuote(value), {
        initialProps: { value: input }, wrapper: wrapper(),
    });
    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    rerender({ value: { ...input, request: { ...input.request, currency: 'USD' } } });
    expect(result.current.state.status).toBe('loading');
    await waitFor(() => expect(preview).toHaveBeenCalledWith(expect.objectContaining({ currency: 'USD' })));
    await act(async () => resolveNext({ ...quote(0, true), currency: 'USD' }));
    await waitFor(() => expect(result.current.state.status).toBe('ready'));
});

it('recovers a failed preview only after a successful explicit retry', async () => {
    vi.spyOn(paymentsApi, 'preview').mockRejectedValueOnce(new Error('Network unavailable')).mockResolvedValueOnce(quote(0, true));
    const { result } = renderHook(() => useCheckoutQuote(input), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.state.status).toBe('error'));
    await act(async () => { await result.current.retry(); });
    await waitFor(() => expect(result.current.state.status).toBe('ready'));
});
