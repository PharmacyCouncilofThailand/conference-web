import { api } from './client';

// Types
export interface Registration {
    id: number;
    regCode: string;
    eventId: number;
    ticketTypeId: number;
    attendeeType: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    organization: string | null;
    status: string;
    qrCode: string | null;
    checkInTime: string | null;
}

export interface CreateRegistrationData {
    eventId: number;
    ticketTypeId: number;
    attendeeType: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    organization?: string;
    licenseNumber?: string;
}

export interface FreeRegistrationRequest {
    eventId: number;
    packageId: string;
}

export interface FreeRegistrationResponse {
    success: boolean;
    data: {
        regCode: string;
        eventName: string;
        ticketName: string;
    };
}

// Registrations API
export const registrationsApi = {
    create: (data: CreateRegistrationData) =>
        api.post<{ success: boolean; data: Registration }>('/api/registrations', data),

    get: (regCode: string) =>
        api.get<{ success: boolean; data: Registration }>(`/api/registrations/${regCode}`),

    listByEvent: (eventId: number) =>
        api.get<{ success: boolean; data: Registration[] }>(`/api/events/${eventId}/registrations`),

    freeRegister: (data: FreeRegistrationRequest) =>
        api.post<FreeRegistrationResponse>('/api/registrations/free', data),
};

// Check-in API
export const checkinApi = {
    lookup: (regCode: string) =>
        api.get<{ success: boolean; data: Registration }>(`/api/check-in/${regCode}`),

    checkIn: (regCode: string) =>
        api.post<{ success: boolean; data: Registration }>(`/api/check-in/${regCode}`, {}),
};
