import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { FilePlus } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// 4.3 Card
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'template' | 'create';
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
    const baseStyles = 'rounded-lg p-6 transition-all duration-150';

    const variants = {
        default: 'bg-white border border-border-base shadow-sm',
        template: 'bg-white border border-border-base shadow-sm cursor-pointer hover:shadow-md hover:border-brand-primary',
        create: 'bg-brand-primary text-white cursor-pointer hover:bg-[#1565A0] shadow-sm flex flex-col items-center justify-center text-center'
    };

    return (
        <div className={cn(baseStyles, variants[variant], className)} {...props}>
            {variant === 'create' ? (
                <>
                    <FilePlus className="h-8 w-8 mb-3" />
                    <h3 className="font-semibold text-lg">Criar novo documento</h3>
                </>
            ) : children}
        </div>
    );
}
