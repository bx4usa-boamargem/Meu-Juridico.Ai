import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Star } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export type BadgeVariant = 'publicado' | 'em-revisao' | 'licitatorio' | 'em-breve' | 'rascunho';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant: BadgeVariant;
}

export function Badge({ className, variant, children, ...props }: BadgeProps) {
    const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold';

    const variants = {
        'publicado': 'bg-status-green-bg text-status-green',
        'em-revisao': 'bg-status-yellow-bg text-status-yellow',
        'licitatorio': 'bg-badge-licitatorio-bg text-badge-licitatorio',
        'em-breve': 'bg-[#FEF9C3] text-[#92400E]',
        'rascunho': 'bg-[#F1F5F9] text-text-secondary'
    };

    return (
        <div className={cn(baseStyles, variants[variant], className)} {...props}>
            {children}
            {variant === 'em-breve' && <Star className="ml-1 h-3 w-3 fill-current" />}
        </div>
    );
}
