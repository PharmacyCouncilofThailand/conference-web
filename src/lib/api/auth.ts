import { api, apiClient } from './client';

// Types matching the actual API response
export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    studentLevel?: string | null;
    country: string | null;
    delegateType?: string;
    isThai?: boolean;
    idCard?: string | null;
}

interface LoginResponse {
    success: boolean;
    token: string;
    user: User;
}

interface RegisterResponse {
    success: boolean;
    token?: string;
    user: {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        studentLevel?: string | null;
        status: string;
    };
}

// Auth API
export const authApi = {
    login: (email: string, password: string, recaptchaToken?: string) =>
        api.post<LoginResponse>('/auth/login', { email, password, ...(recaptchaToken && { recaptchaToken }) }),

    register: (formData: FormData) =>
        apiClient<RegisterResponse>('/auth/register', {
            method: 'POST',
            body: formData,
        }),

    me: () => api.get<{ success: boolean; user: User }>('/api/users/profile'),

    logout: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    },
};
