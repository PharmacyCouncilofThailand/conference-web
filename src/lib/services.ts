import {
    Event,
    RegistrationRequest,
    RegistrationResponse,
    MemberVerifyResponse,
    CheckoutResponse,
    PaymentVerifyResponse,
    FeedbackRequest,
} from '@/types';
import { apiClient } from './api/client';
import { API_URL } from '@/config';
import { parseAllowedList } from '@/lib/utils';

// ===========================================
// Service Layer — Real API calls
// ===========================================

// ========== EVENT SERVICES ==========

/**
 * Get all published events
 */
export async function getEvents(): Promise<Event[]> {
    const res = await apiClient<{ events: any[] }>('/api/events');
    return (res.events || []).map(mapApiEventToEvent);
}

/**
 * Get single event by ID or event code
 */
export async function getEventById(id: string): Promise<Event> {
    const res = await apiClient<{ event: any }>(`/api/events/${id}`);
    if (!res.event) throw new Error('Event not found');
    return mapApiEventToEvent(res.event);
}

/**
 * Map API event response to frontend Event type
 */
function mapApiEventToEvent(apiEvent: any): Event {
    return {
        id: String(apiEvent.id),
        code: apiEvent.eventCode || '',
        name: apiEvent.eventName || apiEvent.name || '',
        title: apiEvent.eventName || apiEvent.name || '',
        description: apiEvent.description || '',
        mapUrl: apiEvent.mapUrl || '',
        eventType: apiEvent.eventType || 'single',
        status: apiEvent.status || 'published',
        venue: apiEvent.location || '',
        capacity: apiEvent.maxCapacity || 0,
        maxCapacity: apiEvent.maxCapacity || 0,
        registeredCount: apiEvent.registeredCount || 0,
        cpeCredits: apiEvent.cpeCredits || '0',
        startDate: apiEvent.startDate || '',
        endDate: apiEvent.endDate || '',
        registrationOpens: apiEvent.registrationOpens || '',
        registrationCloses: apiEvent.registrationCloses || '',
        coverImage: apiEvent.coverImage || '',
        videoUrl: apiEvent.videoUrl || '',
        venueImage: apiEvent.venueImage || '',
        imageUrl: apiEvent.imageUrl || '',
        image: apiEvent.imageUrl || '',
        location: apiEvent.location || '',
        price: apiEvent.price ?? 0,
        category: apiEvent.category || '',
        createdAt: apiEvent.createdAt || '',
        firstSessionStart: apiEvent.firstSessionStart || undefined,
        // Pass through nested data if present
        ticketTypes: (apiEvent.ticketTypes || []).map((t: any) => {
            const allowedRoles = parseAllowedList(t.allowedRoles);
            const allowedStudentLevels = parseAllowedList(t.allowedStudentLevels);
            return {
                ...t,
                ticketCategory: t.ticketCategory || t.category,
                category: t.priority || t.category,
                allowedRoles,
                allowedStudentLevels,
                salesStart: t.salesStart || t.saleStartDate || undefined,
                salesEnd: t.salesEnd || t.saleEndDate || undefined,
            };
        }),
        sessions: apiEvent.sessions || [],
        speakers: apiEvent.speakers || [],
        images: apiEvent.images || [],
        attachments: apiEvent.attachments || [],
        documents: apiEvent.documents || [],
        rounds: apiEvent.rounds || [],
        schedule: apiEvent.schedule || [],
        websiteUrl: apiEvent.websiteUrl || null,
    };
}

// ========== MEMBER VERIFICATION ==========

/**
 * Verify pharmacist license number
 */
export async function verifyMember(licenseNumber: string): Promise<MemberVerifyResponse> {
    try {
        const res = await apiClient<MemberVerifyResponse>('/api/users/verify-member', {
            method: 'POST',
            body: JSON.stringify({ licenseNumber }),
        });
        return res;
    } catch {
        return { valid: false };
    }
}

// ========== REGISTRATION SERVICES ==========

/**
 * Create new registration
 */
export async function createRegistration(data: RegistrationRequest): Promise<RegistrationResponse> {
    const res = await apiClient<{ success: boolean; data: any }>('/api/registrations', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return {
        registration: {
            id: String(res.data?.id || ''),
            registrationNumber: res.data?.regCode || '',
            qrCode: res.data?.qrCode || '',
            amount: res.data?.amount || 0,
        },
    };
}

// ========== PAYMENT SERVICES ==========

/**
 * Create checkout session
 */
export async function createCheckoutSession(
    registrationId: string,
    successUrl: string,
    cancelUrl: string
): Promise<CheckoutResponse> {
    const res = await apiClient<{ success: boolean; data: any }>('/api/payments/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ registrationId, successUrl, cancelUrl }),
    });
    return {
        checkoutUrl: res.data?.url || '',
        sessionId: res.data?.sessionId || '',
    };
}

/**
 * Verify payment status
 */
export async function verifyPayment(sessionId: string): Promise<PaymentVerifyResponse> {
    const res = await apiClient<{ success: boolean; data: any }>(`/api/payments/verify/${sessionId}`);
    return {
        status: res.data?.status || 'unpaid',
        registrationId: String(res.data?.registrationId || ''),
    };
}

// ========== PROMO CODE SERVICES ==========

export interface PromoValidationResult {
    valid: boolean;
    discount?: { type: 'percentage' | 'fixed'; value: number };
    error?: string;
}

/**
 * Validate a promo code against the API
 */
export async function validatePromoCode(code: string, eventId?: string): Promise<PromoValidationResult> {
    try {
        const res = await apiClient<{ success: boolean; data: any }>('/api/payments/validate-promo', {
            method: 'POST',
            body: JSON.stringify({ code, eventId }),
        });
        if (res.success && res.data) {
            return {
                valid: true,
                discount: res.data.discount,
            };
        }
        return { valid: false, error: 'โค้ดส่วนลดไม่ถูกต้อง' };
    } catch {
        return { valid: false, error: 'โค้ดส่วนลดไม่ถูกต้อง' };
    }
}

// ========== FEEDBACK SERVICES ==========

/**
 * Submit feedback
 */
export async function submitFeedback(data: FeedbackRequest): Promise<{ success: boolean }> {
    return apiClient<{ success: boolean }>('/api/feedback', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

// ========== USER REGISTRATION SERVICES ==========

export interface UserRegistration {
    id: number;
    regCode: string;
    status: string;
    createdAt: string;
    event: {
        id: number;
        eventName: string;
        startDate: string;
        endDate: string | null;
        location: string | null;
        imageUrl: string | null;
    } | null;
    ticketType: {
        id: number;
        name: string;
        price: string;
    } | null;
    payment: {
        id: number;
        amount: string;
        status: string;
        paidAt: string | null;
    } | null;
}

/**
 * Get current user's registrations
 */
export async function getUserRegistrations(token: string): Promise<UserRegistration[]> {
    try {
        const res = await fetch(`${API_URL}/api/payments/my-tickets`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        if (!res.ok) return [];
        const data = await res.json();
        if (!data.success || !Array.isArray(data.data)) return [];
        return data.data.map((reg: any) => ({
            id: reg.eventId || 0,
            regCode: reg.regCode || '',
            status: reg.status || '',
            createdAt: reg.purchasedAt || '',
            event: reg.eventName ? {
                id: reg.eventId,
                eventName: reg.eventName,
                startDate: reg.eventStartDate || '',
                endDate: reg.eventEndDate || null,
                location: reg.eventLocation || null,
                imageUrl: reg.eventImageUrl || null,
            } : null,
            ticketType: reg.ticketName ? { id: reg.ticketTypeId || 0, name: reg.ticketName, price: reg.amount || '0' } : null,
            payment: reg.receiptUrl ? {
                id: 0,
                amount: reg.amount || '0',
                status: 'paid',
                paidAt: reg.purchasedAt || null,
            } : null,
        }));
    } catch {
        return [];
    }
}
