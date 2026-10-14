import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import PaymentPage from './page';
import { paymentsApi } from '@/lib/api/payments';
import type { CheckoutPaymentData } from '@/lib/checkout/paymentRequest';

const router = vi.hoisted(() => ({ push: vi.fn(), back: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ isLoggedIn: true, isLoading: false }) }));
vi.mock('@/components/layout/Navbar', () => ({ Navbar: () => null }));
vi.mock('@/components/layout/Footer', () => ({ Footer: () => null }));

const data: CheckoutPaymentData = {
    eventId: '2', quotedTotal: 0, currency: 'USD',
    originApp: 'pris2026', returnTo: 'https://event.example.test', websiteUrl: 'https://event.example.test',
    firstName: 'Test', lastName: 'User', email: 'test@example.test', phone: '0800000000', country: 'US',
    selectedPackage: '7', selectedAddOns: [], selectedWorkshopTopic: undefined,
    selectedOptionalSessions: [], ownedSessionIds: [], isAddonOnly: false, purchasedAddOns: [],
    dietaryRequirement: '', dietaryOtherText: '', paymentMethod: null, promoCode: 'FREE100', promoApplied: true,
    needTaxInvoice: false, taxName: '', taxId: '', taxAddress: '', taxSubDistrict: '', taxDistrict: '', taxProvince: '', taxPostalCode: '',
};
beforeEach(() => {
    vi.clearAllMocks(); sessionStorage.clear();
    sessionStorage.setItem('checkout-payment-data', JSON.stringify(data));
    sessionStorage.setItem('checkout-wizard-2', JSON.stringify({ currentStep: 4, checkoutData: data }));
});
afterEach(() => vi.restoreAllMocks());

it.each(['missing', 'malformed', 'null'])('starts over without an API mutation for %s checkout data', async (state) => {
    if (state === 'missing') sessionStorage.removeItem('checkout-payment-data');
    else sessionStorage.setItem('checkout-payment-data', state === 'null' ? 'null' : '{invalid');
    const create = vi.spyOn(paymentsApi, 'createIntent');
    render(<PaymentPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'กลับไปตรวจสอบราคา' }));
    expect(create).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith('/events');
    expect(screen.queryByRole('button', { name: 'ลองใหม่' })).not.toBeInTheDocument();
});

it('submits a free request once and keeps the currency and external return context', async () => {
    sessionStorage.setItem('payment-gateway', 'paysolutions');
    sessionStorage.setItem('payment-refno', 'OLD-REF');
    const create = vi.spyOn(paymentsApi, 'createIntent').mockResolvedValue({
        success: true, free: true, gateway: null, redirectForm: null, refno: null, orderRef: null,
        orderNumber: 'CONF-FREE', regCode: 'REG-FREE', totalAmount: '0', currency: 'USD',
    });
    render(<PaymentPage />);
    await waitFor(() => expect(router.push).toHaveBeenCalledOnce());
    expect(create).toHaveBeenCalledOnce();
    expect(create.mock.calls[0][0]).not.toHaveProperty('paymentMethod');
    expect(create.mock.calls[0][0].needTaxInvoice).toBe(false);
    const resultUrl = new URL(router.push.mock.calls[0][0], 'https://web.example.test');
    expect(resultUrl.searchParams.get('currency')).toBe('USD');
    expect(resultUrl.searchParams.get('originApp')).toBe('pris2026');
    expect(resultUrl.searchParams.get('returnTo')).toBe(data.returnTo);
    expect(sessionStorage.getItem('payment-refno')).toBeNull();
    expect(sessionStorage.getItem('checkout-payment-data')).not.toBeNull();
});

it('offers review rather than retrying a price conflict without a chosen method', async () => {
    const create = vi.spyOn(paymentsApi, 'createIntent').mockRejectedValue(Object.assign(new Error('Total changed'), {
        code: 'PAYMENT_METHOD_REQUIRED', status: 409,
    }));
    render(<PaymentPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'กลับไปตรวจสอบราคา' }));
    expect(create).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'ลองใหม่' })).not.toBeInTheDocument();
    const path = new URL(router.push.mock.calls[0][0], 'https://web.example.test');
    expect(path.pathname).toBe('/checkout/2');
    expect(path.searchParams.get('checkoutError')).toBe('PAYMENT_METHOD_REQUIRED');
    expect(path.searchParams.get('originApp')).toBe('pris2026');
    const wizard = JSON.parse(sessionStorage.getItem('checkout-wizard-2')!);
    expect(wizard.currentStep).toBe(2);
    expect(wizard.checkoutData.paymentMethod).toBeNull();
    expect(wizard.checkoutData.promoCode).toBe('FREE100');
});

it('does not submit legacy stored data that has no authoritative quote', async () => {
    const legacy = { ...data } as Partial<CheckoutPaymentData>;
    delete legacy.quotedTotal;
    sessionStorage.setItem('checkout-payment-data', JSON.stringify(legacy));
    const create = vi.spyOn(paymentsApi, 'createIntent');
    render(<PaymentPage />);
    await screen.findByRole('button', { name: 'กลับไปตรวจสอบราคา' });
    expect(create).not.toHaveBeenCalled();
});
it('shows confirmation processing while a free intent is pending', async () => {
    let resolveIntent!: (value: Awaited<ReturnType<typeof paymentsApi.createIntent>>) => void;
    vi.spyOn(paymentsApi, 'createIntent').mockImplementation(() => new Promise((resolve) => { resolveIntent = resolve; }));
    render(<PaymentPage />);
    await screen.findByText('กำลังยืนยันการลงทะเบียน');
    expect(screen.queryByText('ระบบกำลังเชื่อมต่อกับ payment gateway...')).not.toBeInTheDocument();
    await act(async () => resolveIntent({
        success: true, free: true, gateway: null, redirectForm: null, refno: null, orderRef: null,
        regCode: 'REG-FREE', orderNumber: 'CONF-FREE', totalAmount: '0', currency: 'USD',
    }));
});

it('preserves explicit paid card selection and submits the provider form once', async () => {
    sessionStorage.setItem('checkout-payment-data', JSON.stringify({ ...data, quotedTotal: 500, paymentMethod: 'card', promoApplied: false }));
    const create = vi.spyOn(paymentsApi, 'createIntent').mockResolvedValue({
        success: true, free: false, gateway: 'paysolutions', refno: 'TEST-REF', orderRef: null,
        orderNumber: 'CONF-PAID', regCode: null, totalAmount: '500', currency: 'USD',
        redirectForm: { actionUrl: 'https://gateway.example.test/payment', fields: { refno: 'TEST-REF' } },
    });
    const submit = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => undefined);
    const { container } = render(<PaymentPage />);
    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
    expect(create.mock.calls[0][0].paymentMethod).toBe('card');
    expect(container.querySelector('form')?.getAttribute('action')).toBe('https://gateway.example.test/payment');
    expect(router.push).not.toHaveBeenCalled();
});
