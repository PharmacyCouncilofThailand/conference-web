import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Map backend role codes to Conference-hub display labels.
 * Roles: pharmacist, medical_professional, student, general
 */
export function getUserRoleLabel(role: string): string {
    switch (role) {
        case 'pharmacist':
            return 'Pharmacist';
        case 'medical_professional':
            return 'Medical Professional';
        case 'student':
            return 'Student';
        case 'general':
            return 'General';
        case 'public':
        default:
            return 'Guest';
    }
}

/** Badge color classes for each Conference-hub role */
export function getUserRoleBadgeColor(role: string): string {
    switch (role) {
        case 'pharmacist':
            return 'bg-[#8a8a00]/20 text-[#8a8a00]';
        case 'medical_professional':
            return 'bg-indigo-100 text-indigo-600';
        case 'student':
            return 'bg-blue-100 text-blue-600';
        case 'general':
            return 'bg-gray-100 text-gray-600';
        case 'public':
        default:
            return 'bg-gray-200 text-gray-600';
    }
}


export const studentLevelLabels: Record<string, string> = {
    postgraduate: 'Postgraduate',
    undergraduate: 'Undergraduate',
};

export function getStudentLevelLabel(level?: string | null): string {
    if (!level) return 'Not specified';
    return studentLevelLabels[level] || level;
}

export function formatStudentLevelList(levels?: string[] | null, fallback = 'All student levels'): string {
    if (!levels || levels.length === 0) return fallback;
    return levels.map((level) => getStudentLevelLabel(level)).join(', ');
}

export function parseAllowedList(raw: unknown): string[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
    if (typeof raw !== 'string') return [];

    const value = raw.trim();
    if (!value) return [];

    if (value.startsWith('[')) {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
        } catch {
            return [];
        }
    }

    return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

export function ticketAllowsUser(
    ticket: { allowedRoles?: string[] | string | null; allowedStudentLevels?: string[] | string | null },
    userRole?: string | null,
    studentLevel?: string | null,
): boolean {
    const allowedRoles = parseAllowedList(ticket.allowedRoles);
    if (allowedRoles.length === 0) return true;

    const role = userRole && userRole !== 'public' ? userRole : 'general';
    if (!allowedRoles.includes(role)) return false;

    const allowedStudentLevels = parseAllowedList(ticket.allowedStudentLevels);
    if (role === 'student' && allowedStudentLevels.length > 0) {
        return !!studentLevel && allowedStudentLevels.includes(studentLevel);
    }

    return true;
}

export type EffectiveTicketIdentitySource = 'account' | 'pharmacist_postgraduate_eligibility';

export function getEffectiveTicketIdentity(
    userRole?: string | null,
    studentLevel?: string | null,
    hasApprovedPostgraduateEligibility = false,
): { role: string; studentLevel: string | null; source: EffectiveTicketIdentitySource } {
    const role = userRole && userRole !== 'public' ? userRole : 'general';

    if (role === 'pharmacist' && hasApprovedPostgraduateEligibility) {
        return {
            role: 'student',
            studentLevel: 'postgraduate',
            source: 'pharmacist_postgraduate_eligibility',
        };
    }

    return {
        role,
        studentLevel: studentLevel || null,
        source: 'account',
    };
}
