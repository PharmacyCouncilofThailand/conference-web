import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import PaymentResultPage from './page';
import { paymentsApi } from '@/lib/api/payments';

const context = vi.hoisted(() => ({ params: 'free=1&orderNumber=CONF-FREE&regCode=REG-FREE&currency=USD', push: vi.fn() }));
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(context.params), useRouter: () => ({ push: context.push }) }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ isLoggedIn: true, isLoading: false }) }));
vi.mock('@/components/layout/Navbar', () => ({ Navbar: () => null }));
vi.mock('@/components/layout/Footer', () => ({ Footer: () => null }));
vi.mock('@/components/ticket/QRCodeTicket', () => ({ QRCodeTicket: ({ regCode }: { regCode: string }) => <div>{regCode}</div> }));
beforeEach(() => { sessionStorage.clear(); vi.clearAllMocks(); context.params = 'free=1&orderNumber=CONF-FREE&regCode=REG-FREE&currency=USD'; });
afterEach(() => vi.restoreAllMocks());

it('shows USD zero after cleaning the payment session without provider polling', async () => {
    sessionStorage.setItem('checkout-payment-data', JSON.stringify({ currency: 'USD', websiteUrl: 'https://event.example.test' }));
    sessionStorage.setItem('payment-event-id', '2');
    const verify = vi.spyOn(paymentsApi, 'verify');
    render(<PaymentResultPage />);
    expect(await screen.findByText('$0.00')).toBeInTheDocument();
    expect(screen.getByText('REG-FREE')).toBeInTheDocument();
    expect(verify).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('checkout-payment-data')).toBeNull();
});

it('uses stored USD for a legacy free URL without a currency parameter', async () => {
    context.params = 'free=1&orderNumber=CONF-FREE&regCode=REG-FREE';
    sessionStorage.setItem('checkout-payment-data', JSON.stringify({ currency: 'USD' }));
    render(<PaymentResultPage />);
    expect(await screen.findByText('$0.00')).toBeInTheDocument();
});
it('shows THB zero for an explicit THB free result', async () => {
    context.params = 'free=1&orderNumber=CONF-FREE&regCode=REG-FREE&currency=THB';
    render(<PaymentResultPage />);
    expect(await screen.findByText('฿0.00')).toBeInTheDocument();
});

it('captures the event website before clearing stored redirect context', async () => {
    sessionStorage.setItem('checkout-payment-data', JSON.stringify({
        currency: 'USD', websiteUrl: 'https://event.example.test', returnTo: 'https://fallback.example.test',
    }));
    render(<PaymentResultPage />);
    await screen.findByText('$0.00');
    const eventLink = screen.getByRole('link', { name: 'กลับไปหน้าเว็บไซต์' });
    expect(eventLink.getAttribute('href')).toBe('https://event.example.test');
    expect(sessionStorage.getItem('checkout-payment-data')).toBeNull();
});
it('keeps the existing SSO countdown after capturing and clearing context', async () => {
    sessionStorage.setItem('checkout-payment-data', JSON.stringify({
        currency: 'USD', originApp: 'pris2026', websiteUrl: 'https://event.example.test',
    }));
    const { unmount } = render(<PaymentResultPage />);
    await screen.findByText('$0.00');
    expect(screen.getByText(/กลับไปหน้าเว็บไซต์อัตโนมัติใน/)).toBeInTheDocument();
    expect(sessionStorage.getItem('checkout-payment-data')).toBeNull();
    unmount();
});
