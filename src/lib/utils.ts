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
            return 'bg-[#537547]/20 text-[#537547]';
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
