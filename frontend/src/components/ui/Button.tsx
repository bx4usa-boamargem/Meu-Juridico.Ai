import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// 4.1 Button
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    isLoading?: boolean;
}

export function Button({
    className,
    variant = 'primary',
    isLoading = false,
    children,
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2';

    const variants = {
        primary: 'bg-brand-primary text-white hover:bg-[#1565A0]',
        secondary: 'border border-border-mid text-text-primary hover:bg-main',
        ghost: 'text-brand-primary hover:bg-brand-light',
        danger: 'bg-status-red text-white hover:bg-[#B91C1C]'
    };

    const loadingStyles = 'opacity-70 cursor-not-allowed';

    return (
        <button
            className={cn(
                baseStyles,
                variants[variant],
                (isLoading || disabled) && loadingStyles,
                className
            )}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
}
