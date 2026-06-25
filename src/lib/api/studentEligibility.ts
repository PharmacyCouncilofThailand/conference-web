import { api } from './client';

export type StudentEligibilityStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface StudentEligibility {
    id: number;
    eventId: number;
    eventCode: string;
    eventName: string;
    role?: string | null;
    accountStatus?: string | null;
    studentLevel: 'postgraduate';
    status: StudentEligibilityStatus;
    documentFileName?: string | null;
    documentUrl?: string | null;
    rejectionReason?: string | null;
    resubmissionCount?: number;
    createdAt?: string;
    updatedAt?: string;
    reviewedAt?: string | null;
}

interface StudentEligibilityMeResponse {
    success: boolean;
    eligibility: StudentEligibility | null;
}

export const studentEligibilityApi = {
    getMe: (eventCode: string) =>
        api.get<StudentEligibilityMeResponse>(`/api/events/${encodeURIComponent(eventCode)}/student-eligibility/me`),
};

export function hasApprovedPostgraduateEligibility(eligibility?: StudentEligibility | null): boolean {
    return eligibility?.status === 'approved' && eligibility.studentLevel === 'postgraduate';
}
