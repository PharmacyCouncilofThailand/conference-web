'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import React, { useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                // Don't refetch every time the window/tab regains focus
                // (switching apps, minimizing, alt-tabbing) — this was firing a
                // full burst of requests on every focus change.
                refetchOnWindowFocus: false,
                // Treat data as fresh for 5 minutes so navigating back and forth
                // (or remounting) reuses the cache instead of refetching.
                staleTime: 5 * 60 * 1000,
                gcTime: 10 * 60 * 1000,
                retry: 1,
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                {children}
            </AuthProvider>
        </QueryClientProvider>
    );
}

