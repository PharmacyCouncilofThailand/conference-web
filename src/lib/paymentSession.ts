export function clearPaymentProviderSessionForFreeResult(storage: Storage): void {
    storage.removeItem('payment-gateway');
    storage.removeItem('payment-orderRef');
    storage.removeItem('payment-refno');
}

export function resolveFreeResultCurrency(urlCurrency: string | null, storedCurrency?: string | null): 'THB' | 'USD' {
    if (urlCurrency === 'THB' || urlCurrency === 'USD') return urlCurrency;
    if (storedCurrency === 'THB' || storedCurrency === 'USD') return storedCurrency;
    return 'THB';
}
