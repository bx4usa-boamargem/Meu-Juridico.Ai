import { Check } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface StepIndicatorProps {
    steps: { id: number; label: string }[];
    currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
    return (
        <div className="flex flex-col mb-8">
            <div className="flex items-center justify-between w-full relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-border-base z-0"></div>

                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-brand-primary z-0 transition-all duration-300"
                    style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                ></div>

                {steps.map((step) => {
                    const isCompleted = step.id < currentStep;
                    const isActive = step.id === currentStep;

                    return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center">
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-white border-2 transition-all duration-300",
                                    isCompleted ? "border-brand-primary bg-brand-primary text-white" :
                                        isActive ? "border-brand-primary text-brand-primary" : "border-border-mid text-text-muted"
                                )}
                            >
                                {isCompleted ? <Check className="w-5 h-5" /> : step.id}
                            </div>
                            <span
                                className={cn(
                                    "absolute top-12 text-xs font-semibold whitespace-nowrap",
                                    isActive || isCompleted ? "text-brand-dark" : "text-text-muted"
                                )}
                            >
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
            <div className="h-8"></div> {/* Spacer for labels */}
        </div>
    );
}
