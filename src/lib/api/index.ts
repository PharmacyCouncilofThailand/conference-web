// API Client
export { api, apiClient, apiClientWithToken, type ApiError } from './client';

// API Modules
export { authApi, type User } from './auth';
export { eventsApi, type Event, type EventWithTickets, type TicketType, type Speaker } from './events';
export { registrationsApi, checkinApi, type Registration, type CreateRegistrationData, type FreeRegistrationRequest, type FreeRegistrationResponse } from './registrations';
export {
    paymentsApi,
    type CreateIntentRequest,
    type CreateIntentResponse,
    type VerifyResponse,
    type MyTicketsResponse,
    type MyPurchasesResponse,
    type PreviewRequest,
    type PreviewResponse,
} from './payments';
export {
    studentEligibilityApi,
    hasApprovedPostgraduateEligibility,
    type StudentEligibility,
    type StudentEligibilityStatus,
} from './studentEligibility';
