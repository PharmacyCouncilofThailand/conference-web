import { API_URL } from '@/config';

const AUTH_UNAUTHORIZED_EVENT = 'conference-web-auth:unauthorized';

// Get token from localStorage
const getToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('token');
    }
    return null;
};

// Generic API call function
export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = getToken();

    const isFormData = options.body instanceof FormData;

    const config: RequestInit = {
        ...options,
        headers: {
            ...(!isFormData && { 'Content-Type': 'application/json' }),
            'X-Source-App': 'conference-web',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
    };

    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (!response.ok) {
        // Dispatch 401 event for centralized logout
        if (response.status === 401 && typeof window !== 'undefined') {
            window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
        }
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        const error = new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
        (error as ApiError).code = errorData.code;
        (error as ApiError).status = response.status;
        throw error;
    }

    return response.json();
}

// Extended error type
export interface ApiError extends Error {
    code?: string;
    status?: number;
}

// Authenticated API call (with explicit token)
export async function apiClientWithToken<T>(endpoint: string, token: string, options: RequestInit = {}): Promise<T> {
    const isFormData = options.body instanceof FormData;

    const config: RequestInit = {
        ...options,
        headers: {
            ...(!isFormData && { 'Content-Type': 'application/json' }),
            'X-Source-App': 'conference-web',
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
    };

    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (!response.ok) {
        if (response.status === 401 && typeof window !== 'undefined') {
            window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
        }
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        const error = new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
        (error as ApiError).code = errorData.code;
        (error as ApiError).status = response.status;
        throw error;
    }

    return response.json();
}

// HTTP method helpers
export const api = {
    get: <T>(endpoint: string) => apiClient<T>(endpoint),

    post: <T>(endpoint: string, data: unknown) =>
        apiClient<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    put: <T>(endpoint: string, data: unknown) =>
        apiClient<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    delete: <T>(endpoint: string) =>
        apiClient<T>(endpoint, { method: 'DELETE' }),
};
