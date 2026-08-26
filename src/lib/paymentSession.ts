export function clearPaymentProviderSessionForFreeResult(storage: Storage): void {
    storage.removeItem('payment-gateway');
    storage.removeItem('payment-orderRef');
    storage.removeItem('payment-refno');
}
