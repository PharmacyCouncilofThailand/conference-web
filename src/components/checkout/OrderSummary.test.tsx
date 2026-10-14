import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrderSummary } from './OrderSummary';
import type { CheckoutQuoteState } from '@/hooks/checkout/useCheckoutQuote';

const quoteState: CheckoutQuoteState = {
    status: 'ready', quote: {
        success: true, subtotal: 500, discountAmount: 500, discountType: 'percentage', discountValue: 100,
        netAmount: 0, fee: 0, total: 0, currency: 'THB', feeMethod: null, promoValid: true, promoError: null,
    }
};
const props = {
    eventName: 'Test Event', selectedPackage: '7', selectedAddOns: [], currency: 'THB' as const,
    packages: [{ id: '7', groupName: 'Main', name: 'Main Ticket', price: 500, currency: 'THB', quota: 100, soldCount: 0, available: 100, isActive: true }],
    addons: [], promoCode: 'FREE100', promoApplied: true,
    onPromoCodeChange: vi.fn(), onApplyPromo: vi.fn().mockResolvedValue(undefined), onRemovePromo: vi.fn(),
    onSubmit: vi.fn(), isSubmitting: false, canSubmit: true, showSubmit: false, quoteState,
};

describe('checkout final action', () => {
    it('does not render a submit button before the final step', () => {
        render(<OrderSummary {...props} />);
        expect(screen.queryByRole('button', { name: /ชำระเงิน|ยืนยันการลงทะเบียน/ })).not.toBeInTheDocument();
    });
    it('confirms a free registration only when clicked', () => {
        render(<OrderSummary {...props} showSubmit />);
        expect(props.onSubmit).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'ยืนยันการลงทะเบียน' }));
        expect(props.onSubmit).toHaveBeenCalledOnce();
    });
    it('keeps loading or failed quotes disabled even if canSubmit was incorrectly supplied', () => {
        const { rerender } = render(<OrderSummary {...props} showSubmit quoteState={{ status: 'loading' }} />);
        expect(screen.getByRole('button', { name: /กำลังตรวจสอบราคา/ })).toBeDisabled();
        rerender(<OrderSummary {...props} showSubmit quoteState={{ status: 'error', error: new Error('Quote unavailable') }} />);
        expect(screen.getByRole('button', { name: /ตรวจสอบราคา/ })).toBeDisabled();
    });
    it('uses server totals instead of a local package-price fallback', () => {
        const paidState: CheckoutQuoteState = {
            status: 'ready', quote: {
                ...quoteState.quote, discountAmount: 0, discountType: null, discountValue: null,
                subtotal: 450, netAmount: 450, total: 450, promoValid: false,
            }
        };
        render(<OrderSummary {...props} promoApplied={false} showSubmit quoteState={paidState} />);
        expect(screen.getByRole('button', { name: 'ชำระเงิน ฿450.00' })).toBeEnabled();
    });
});
beforeEach(() => vi.clearAllMocks());
