import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface TabsProps {
    tabs: { id: string; label: string }[];
    activeTab: string;
    onChange: (id: string) => void;
    variant?: 'line' | 'pill';
    className?: string;
}

export function Tabs({ tabs, activeTab, onChange, variant = 'line', className }: TabsProps) {
    if (variant === 'pill') {
        return (
            <div className={cn("inline-flex space-x-2 bg-white rounded-full border border-border-base p-1", className)}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={cn(
                            "px-4 py-1.5 text-sm font-medium rounded-full transition-colors",
                            activeTab === tab.id
                                ? "bg-brand-primary text-white"
                                : "text-text-secondary hover:text-text-primary"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        );
    }

    // Line variant
    return (
        <div className={cn("flex space-x-8 border-b border-border-base overflow-x-auto", className)}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={cn(
                        "pb-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
                        activeTab === tab.id
                            ? "border-brand-primary text-brand-primary font-bold"
                            : "border-transparent text-text-secondary hover:text-text-primary"
                    )}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
