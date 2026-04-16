import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    text?: string;
}

const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
};

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
    return (
        <div className={cn('flex items-center justify-center gap-2', className)}>
            <Loader2 className={cn('animate-spin text-[#8a8a00]', sizeClasses[size])} />
            {text && <span className="text-gray-400 text-sm">{text}</span>}
        </div>
    );
}

// Full page loading
export function PageLoading({ text = 'กำลังโหลด...' }: { text?: string }) {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-center">
                <LoadingSpinner size="lg" className="mb-4" />
                <p className="text-gray-500">{text}</p>
            </div>
        </div>
    );
}

// Inline loading (for buttons, forms)
export function InlineLoading({ text }: { text?: string }) {
    return (
        <div className="flex items-center gap-2">
            <LoadingSpinner size="sm" />
            {text && <span className="text-sm">{text}</span>}
        </div>
    );
}

// Overlay loading
export function LoadingOverlay({ text = 'กำลังดำเนินการ...' }: { text?: string }) {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-lg">
                <LoadingSpinner size="lg" className="mb-4" />
                <p className="text-gray-700">{text}</p>
            </div>
        </div>
    );
}

export default LoadingSpinner;
