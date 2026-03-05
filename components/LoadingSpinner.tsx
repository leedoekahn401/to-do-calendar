import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: number;
    className?: string;
    containerClassName?: string;
}

export default function LoadingSpinner({
    size = 32,
    className = "text-accent-orange",
    containerClassName = "flex-1 flex items-center justify-center p-4",
}: LoadingSpinnerProps) {
    return (
        <div className={containerClassName}>
            <Loader2 className={`animate-spin ${className}`} size={size} />
        </div>
    );
}
