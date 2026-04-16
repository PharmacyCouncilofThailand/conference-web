'use client';

import { Check } from 'lucide-react';

interface Step {
    id: number;
    label: string;
}

interface StepIndicatorProps {
    steps: readonly Step[];
    currentStep: number;
    onStepClick?: (step: number) => void;
}

export function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
    return (
        <div className="flex items-center justify-between w-full">
            {steps.map((step, index) => {
                const isCompleted = step.id < currentStep;
                const isCurrent = step.id === currentStep;
                const isClickable = onStepClick && step.id < currentStep;

                return (
                    <div key={step.id} className="flex items-center flex-1 last:flex-none">
                        <button
                            type="button"
                            onClick={() => isClickable && onStepClick(step.id)}
                            disabled={!isClickable}
                            className={`flex items-center gap-2 group ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                    isCompleted
                                        ? 'bg-[#8a8a00] text-white'
                                        : isCurrent
                                            ? 'bg-[#8a8a00] text-white ring-4 ring-[#8a8a00]/20'
                                            : 'bg-gray-200 text-gray-500'
                                }`}
                            >
                                {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                            </div>
                            <span
                                className={`text-xs sm:text-sm font-medium hidden sm:inline ${
                                    isCurrent
                                        ? 'text-[#8a8a00]'
                                        : isCompleted
                                            ? 'text-gray-700 group-hover:text-[#8a8a00]'
                                            : 'text-gray-400'
                                }`}
                            >
                                {step.label}
                            </span>
                        </button>

                        {index < steps.length - 1 && (
                            <div className="flex-1 mx-2 sm:mx-4">
                                <div
                                    className={`h-0.5 rounded-full transition-colors ${
                                        isCompleted ? 'bg-[#8a8a00]' : 'bg-gray-200'
                                    }`}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
