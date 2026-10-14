import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CheckoutPage from './page';
import { paymentsApi } from '@/lib/api/payments';

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({
    useParams: () => ({ id: '2' }), useSearchParams: () => new URLSearchParams('originApp=pris2026&returnTo=https%3A%2F%2Fevent.example.test'),
    useRouter: () => navigation,
}));
vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        isLoggedIn: true, isLoading: false,
        user: {
            id: 1, role: 'public', country: 'TH', isThai: true,
            firstName: 'Test', lastName: 'User', email: 'test@example.test', phone: '0800000000'
        },
    })
}));
vi.mock('@/components/layout/Navbar', () => ({ Navbar: () => null }));
vi.mock('@/components/layout/Footer', () => ({ Footer: () => null }));
vi.mock('@/components/checkout/EventBanner', () => ({ EventBanner: () => null }));
vi.mock('@/lib/services', () => ({
    getEventById: async () => ({
        id: '2', code: 'TEST', name: 'Test Event', websiteUrl: 'https://event.example.test',
        startDate: '2026-10-29', endDate: '2026-10-30', location: 'Test Hall',
        ticketTypes: [{
            id: 7, name: 'Main Ticket', groupName: 'Main', ticketCategory: 'primary',
            price: '500', currency: 'THB', quota: 100, soldCount: 0, isActive: true, allowedRoles: []
        }],
    })
}));
vi.mock('@/lib/api/pricingEligibility', () => ({
    pricingEligibilityApi: {
        get: async () => ({
            eventId: 2, policyCode: null, applies: false, phase: 'not_applicable', qualifiedForExtension: false,
            effectivePriority: null, effectiveTicketTypeId: null, offerExpiresAt: null, reason: 'not_applicable',
        })
    }
}));
let client: QueryClient;
beforeEach(() => {
    vi.clearAllMocks(); sessionStorage.clear();
    client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    vi.spyOn(paymentsApi, 'myPurchases').mockResolvedValue({
        success: true, data: {
            hasPrimaryTicket: false, primaryTicketName: null, regCode: null, purchasedAddOns: [],
        }
    });
    vi.spyOn(paymentsApi, 'myTickets').mockResolvedValue({ success: true, data: [] });
});
afterEach(() => { client.clear(); vi.restoreAllMocks(); });

it('restores and revalidates a full discount before showing final confirmation', async () => {
    sessionStorage.setItem('checkout-wizard-2', JSON.stringify({
        currentStep: 2, checkoutData: {
            selectedPackage: '7', promoCode: 'FREE100', promoApplied: true,
            needTaxInvoice: true, taxName: 'Old', taxId: '1234567890123', paymentMethod: 'card',
        }
    }));
    const preview = vi.spyOn(paymentsApi, 'preview').mockResolvedValue({
        success: true, subtotal: 500, discountAmount: 500, discountType: 'percentage', discountValue: 100,
        netAmount: 0, fee: 0, total: 0, currency: 'THB', feeMethod: null, promoValid: true, promoError: null,
    });
    render(<QueryClientProvider client={client}><CheckoutPage /></QueryClientProvider>);
    await waitFor(() => expect(preview).toHaveBeenCalledWith(expect.objectContaining({ promoCode: 'FREE100' })));
    expect(screen.queryByRole('button', { name: 'ยืนยันการลงทะเบียน' })).not.toBeInTheDocument();
    const next = await screen.findByRole('button', { name: 'ถัดไป' });
    await waitFor(() => expect(next).toBeEnabled());
    await act(async () => { fireEvent.click(next); });
    await screen.findByText('ยอดสุทธิ 0 บาท ไม่ต้องชำระเงิน');
    expect(screen.queryByText('ต้องการใบกำกับภาษี')).not.toBeInTheDocument();
    expect(screen.queryByText('QR PromptPay / Mobile Banking')).not.toBeInTheDocument();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'ยืนยันการลงทะเบียน' })); });
    expect(navigation.push).toHaveBeenCalledWith('/checkout/payment');
    const stored = JSON.parse(sessionStorage.getItem('checkout-payment-data')!);
    expect(stored.quotedTotal).toBe(0);
    expect(stored.promoApplied).toBe(true);
    expect(stored.promoCode).toBe('FREE100');
    expect(stored.paymentMethod).toBeNull();
    expect(stored.needTaxInvoice).toBe(false);
    expect(stored.originApp).toBe('pris2026');
    expect(stored.returnTo).toBe('https://event.example.test');
});
it('restores tax review after removing a full discount at the final step', async () => {
    sessionStorage.setItem('checkout-wizard-2', JSON.stringify({
        currentStep: 4, checkoutData: {
            selectedPackage: '7', promoCode: 'FREE100', promoApplied: true, needTaxInvoice: true, paymentMethod: 'card',
        }
    }));
    vi.spyOn(paymentsApi, 'preview').mockImplementation(async (request) => ({
        success: true, subtotal: 500, discountAmount: request.promoCode ? 500 : 0,
        discountType: request.promoCode ? 'percentage' : null, discountValue: request.promoCode ? 100 : null,
        netAmount: request.promoCode ? 0 : 500, fee: 0, total: request.promoCode ? 0 : 500,
        currency: 'THB', feeMethod: null, promoValid: Boolean(request.promoCode), promoError: null,
    }));
    render(<QueryClientProvider client={client}><CheckoutPage /></QueryClientProvider>);
    await screen.findByText('ยอดสุทธิ 0 บาท ไม่ต้องชำระเงิน');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'ลบโค้ดส่วนลด' })); });
    const taxChoice = await screen.findByRole('checkbox', { name: /ต้องการใบกำกับภาษี/ });
    expect(taxChoice).not.toBeChecked();
    expect(screen.queryByRole('button', { name: 'ยืนยันการลงทะเบียน' })).not.toBeInTheDocument();
    expect(navigation.push).not.toHaveBeenCalled();
});

it('blocks navigation during pricing and offers recovery on quote failure', async () => {
    sessionStorage.setItem('checkout-wizard-2', JSON.stringify({ currentStep: 2, checkoutData: { selectedPackage: '7' } }));
    let rejectPreview!: (error: Error) => void;
    const pending = new Promise<never>((_resolve, reject) => { rejectPreview = reject; });
    const preview = vi.spyOn(paymentsApi, 'preview').mockReturnValue(pending);
    render(<QueryClientProvider client={client}><CheckoutPage /></QueryClientProvider>);
    await waitFor(() => expect(preview).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'ถัดไป' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /^(ชำระเงิน |ยืนยันการลงทะเบียน$)/ })).not.toBeInTheDocument();
    await act(async () => rejectPreview(new Error('Pricing unavailable')));
    await screen.findByRole('button', { name: 'ตรวจสอบราคาอีกครั้ง' });
    expect(navigation.push).not.toHaveBeenCalled();
});
