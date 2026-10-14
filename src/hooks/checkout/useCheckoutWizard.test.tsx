import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useCheckoutWizard, type CheckoutFlow } from './useCheckoutWizard';

const free: CheckoutFlow = { quoteReady: true, isFree: true };
const paid: CheckoutFlow = { quoteReady: true, isFree: false };
const unknown: CheckoutFlow = { quoteReady: false, isFree: false };
beforeEach(() => sessionStorage.clear());

describe('conditional checkout steps', () => {
    it('skips tax in both directions and permits free confirmation without a method', async () => {
        const { result } = renderHook(() => useCheckoutWizard('2'));
        await waitFor(() => expect(result.current.isRestored).toBe(true));
        act(() => result.current.updateCheckoutData({
            firstName: 'Test', lastName: 'User', email: 'test@example.test', phone: '0800000000', selectedPackage: '7',
        }));
        act(() => result.current.nextStep(free));
        expect(result.current.currentStep).toBe(2);
        act(() => result.current.nextStep(free));
        expect(result.current.currentStep).toBe(4);
        expect(result.current.getSteps(free).map((step) => step.id)).toEqual([1, 2, 4]);
        expect(result.current.canProceedToPayment(free)).toBe(true);
        act(() => result.current.prevStep(free));
        expect(result.current.currentStep).toBe(2);
    });
    it('requires a method for paid checkout and blocks unknown quotes', async () => {
        const { result } = renderHook(() => useCheckoutWizard('2'));
        await waitFor(() => expect(result.current.isRestored).toBe(true));
        act(() => result.current.updateCheckoutData({
            firstName: 'Test', lastName: 'User', email: 'test@example.test', phone: '0800000000', selectedPackage: '7',
        }));
        act(() => result.current.goToStep(2, paid));
        act(() => result.current.nextStep(unknown));
        expect(result.current.currentStep).toBe(2);
        act(() => result.current.nextStep(paid));
        expect(result.current.currentStep).toBe(3);
        act(() => result.current.nextStep(paid));
        expect(result.current.currentStep).toBe(4);
        expect(result.current.canProceedToPayment(paid)).toBe(false);
        act(() => result.current.updateCheckoutData({ paymentMethod: 'qr' }));
        expect(result.current.canProceedToPayment(paid)).toBe(true);
        expect(result.current.canProceedToPayment(unknown)).toBe(false);
    });
    it('keeps paid tax validation while free confirmation ignores tax requirements', async () => {
        const { result } = renderHook(() => useCheckoutWizard('2'));
        await waitFor(() => expect(result.current.isRestored).toBe(true));
        act(() => result.current.updateCheckoutData({
            firstName: 'Test', lastName: 'User', email: 'test@example.test', phone: '0800000000',
            selectedPackage: '7', paymentMethod: 'card', needTaxInvoice: true, taxId: '',
        }));
        expect(result.current.canProceedToPayment(paid)).toBe(false);
        expect(result.current.canProceedToPayment(free)).toBe(true);
    });
    it('restores data without trusting its free flag or persisting owned entitlements', async () => {
        sessionStorage.setItem('checkout-wizard-2', JSON.stringify({
            currentStep: 4, checkoutData: {
                firstName: 'Saved', selectedPackage: '7', promoApplied: true, promoCode: 'FREE100', ownedSessionIds: [99],
            }
        }));
        const { result } = renderHook(() => useCheckoutWizard('2'));
        await waitFor(() => expect(result.current.isRestored).toBe(true));
        expect(result.current.checkoutData.firstName).toBe('Saved');
        expect(result.current.checkoutData.ownedSessionIds).toEqual([]);
        expect(result.current.canProceedToPayment(unknown)).toBe(false);
        const stored = JSON.parse(sessionStorage.getItem('checkout-wizard-2')!);
        expect(stored.checkoutData).not.toHaveProperty('ownedSessionIds');
    });
});
