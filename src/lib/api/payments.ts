import { api } from './client';

export type PaymentGateway = 'paysolutions' | 'ktb' | 'stripe';

interface RedirectForm {
    actionUrl: string;
    fields: Record<string, string>;
}

interface CreateIntentApiResponse {
    success: boolean;
    data?: {
        free?: boolean;
        gateway?: 'pay_solutions' | 'ktb' | 'stripe' | null;
        redirectForm?: RedirectForm | null;
        refno?: string | null;
        orderRef?: string | null;
        orderNumber?: string | null;
        regCode?: string | null;
        total?: string | number | null;
    };
}

interface VerifyApiResponse {
    success: boolean;
    data?: {
        gateway?: 'pay_solutions' | 'ktb' | 'stripe' | null;
        orderNumber?: string | null;
        regCode?: string | null;
        orderStatus?: string | null;
        currency?: string | null;
        payment?: {
            status?: string | null;
            amount?: string | null;
            paymentProvider?: string | null;
        } | null;
    };
}

// ─── Types ───────────────────────────────────────────

export interface CreateIntentRequest {
    eventId: number;
    packageId: string;
    addOnIds: string[];
    currency: 'THB' | 'USD';
    paymentMethod: 'qr' | 'card';
    promoCode?: string;
    workshopSessionId?: number;
    optionalSessionIds?: number[];
    dietaryRequirement?: string;
    needTaxInvoice: boolean;
    taxName?: string;
    taxId?: string;
    taxAddress?: string;
    taxSubDistrict?: string;
    taxDistrict?: string;
    taxProvince?: string;
    taxPostalCode?: string;
}

export interface CreateIntentResponse {
    success: boolean;
    gateway?: PaymentGateway | null;
    free?: boolean;
    redirectForm: RedirectForm | null;
    refno: string | null;
    orderRef: string | null;
    orderNumber: string | null;
    regCode?: string | null;
    totalAmount?: string | null;
}

export interface VerifyRequest {
    gateway?: PaymentGateway | null;
    refno?: string | null;
    orderRef?: string | null;
    paymentIntent?: string | null;
}

export interface VerifyResponse {
    success: boolean;
    status: 'paid' | 'pending' | 'failed' | 'cancelled';
    gateway?: PaymentGateway | null;
    orderNumber?: string;
    regCode?: string;
    amount?: string;
    currency?: string;
}

export interface MyTicketsResponse {
    success: boolean;
    data: Array<{
        regCode: string;
        eventId: number;
        eventCode?: string | null;
        eventName: string;
        eventStartDate: string | null;
        eventEndDate: string | null;
        eventLocation: string | null;
        eventImageUrl: string | null;
        websiteUrl: string | null;
        status: string;
        ticketName: string;
        ticketTypeId: number;
        priority: string;
        purchasedAt: string | null;
        amount: string;
        currency: string;
        includes: string[];
        receiptUrl: string | null;
        galaTicket: {
            id: string;
            status: string;
            name: string;
            purchasedAt: string | null;
            amount: string;
            currency: string;
            dateTimeStart: string | null;
            dateTimeEnd: string | null;
            venue: string | null;
            dietary: string | null;
        } | null;
        workshops: Array<{
            id: string;
            sessionId: number;
            status: string;
            name: string;
            purchasedAt: string | null;
            amount: string;
            currency: string;
            dateTimeStart: string | null;
            dateTimeEnd: string | null;
            venue: string | null;
        }>;
    }>;
}

export interface MyPurchasesResponse {
    success: boolean;
    data: {
        hasPrimaryTicket: boolean;
        primaryTicketName: string | null;
        regCode: string | null;
        purchasedAddOns: string[];
    };
}

export interface PreviewRequest {
    eventId: number;
    packageId: string;
    addOnIds: string[];
    currency: 'THB' | 'USD';
    paymentMethod: 'qr' | 'card';
    promoCode?: string;
}

export interface PreviewResponse {
    success: boolean;
    subtotal: number;
    discountAmount: number;
    finalAmount: number;
    promoValid: boolean;
    promoError: string | null;
    discountType: string | null;
    discountValue: number | null;
}

function normalizeGateway(value?: string | null): PaymentGateway | null {
    switch (value) {
        case 'ktb':
        case 'ktb_fastpay':
            return 'ktb';
        case 'pay_solutions':
        case 'paysolutions':
            return 'paysolutions';
        case 'stripe':
            return 'stripe';
        default:
            return null;
    }
}

function normalizeVerifyStatus(
    paymentStatus?: string | null,
    orderStatus?: string | null
): VerifyResponse['status'] {
    const normalizedPaymentStatus = (paymentStatus || '').toLowerCase();
    const normalizedOrderStatus = (orderStatus || '').toLowerCase();

    if (normalizedPaymentStatus === 'paid' || normalizedOrderStatus === 'paid') {
        return 'paid';
    }

    if (normalizedPaymentStatus === 'cancelled') {
        return 'cancelled';
    }

    if (normalizedPaymentStatus === 'failed' || normalizedPaymentStatus === 'refunded') {
        return 'failed';
    }

    if (normalizedOrderStatus === 'cancelled') {
        return 'cancelled';
    }

    return 'pending';
}

function buildVerifyQuery(params: VerifyRequest): string {
    const query = new URLSearchParams();

    if ((params.gateway === 'ktb' || params.orderRef) && params.orderRef) {
        query.set('gateway', 'ktb');
        query.set('orderRef', params.orderRef);
        return query.toString();
    }

    if (params.paymentIntent) {
        query.set('payment_intent', params.paymentIntent);
        return query.toString();
    }

    if (params.refno) {
        query.set('refno', params.refno);
        return query.toString();
    }

    throw new Error('Missing payment reference');
}

// ─── Payments API ────────────────────────────────────

export const paymentsApi = {
    createIntent: async (data: CreateIntentRequest): Promise<CreateIntentResponse> => {
        const response = await api.post<CreateIntentApiResponse>('/api/payments/create-intent', data);
        const payload = response.data;
        const gateway = normalizeGateway(payload?.gateway ?? null);
        const orderRef = payload?.orderRef || (gateway === 'ktb' ? payload?.refno || null : null);

        return {
            success: response.success,
            free: payload?.free ?? false,
            gateway,
            redirectForm: payload?.redirectForm || null,
            refno: payload?.refno || null,
            orderRef,
            orderNumber: payload?.orderNumber || null,
            regCode: payload?.regCode || null,
            totalAmount: payload?.total != null ? String(payload.total) : null,
        };
    },

    verify: async (params: VerifyRequest): Promise<VerifyResponse> => {
        const query = buildVerifyQuery(params);
        const response = await api.get<VerifyApiResponse>(`/api/payments/verify?${query}`);
        const payload = response.data;

        return {
            success: response.success,
            status: normalizeVerifyStatus(payload?.payment?.status, payload?.orderStatus),
            gateway: normalizeGateway(payload?.gateway ?? payload?.payment?.paymentProvider ?? null),
            orderNumber: payload?.orderNumber || undefined,
            regCode: payload?.regCode || undefined,
            amount: payload?.payment?.amount || undefined,
            currency: payload?.currency || undefined,
        };
    },

    myTickets: (eventId?: number) =>
        api.get<MyTicketsResponse>(
            eventId
                ? `/api/payments/my-tickets?eventId=${encodeURIComponent(String(eventId))}`
                : '/api/payments/my-tickets'
        ),

    myPurchases: (eventId?: number) =>
        api.get<MyPurchasesResponse>(
            eventId
                ? `/api/payments/my-purchases?eventId=${encodeURIComponent(String(eventId))}`
                : '/api/payments/my-purchases'
        ),

    preview: (data: PreviewRequest) =>
        api.post<PreviewResponse>('/api/payments/preview', data),
};
