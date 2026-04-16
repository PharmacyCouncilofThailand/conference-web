'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQAccordionProps {
    items: FAQItem[];
    className?: string;
}

export function FAQAccordion({ items, className = '' }: FAQAccordionProps) {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const toggleItem = (index: number) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    return (
        <div className={`space-y-3 ${className}`}>
            {items.map((item, index) => (
                <div
                    key={index}
                    className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden"
                >
                    <button
                        onClick={() => toggleItem(index)}
                        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
                    >
                        <span className="font-medium pr-4">{item.question}</span>
                        {expandedIndex === index ? (
                            <ChevronUp className="w-5 h-5 text-[#8a8a00] flex-shrink-0" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                    </button>
                    {expandedIndex === index && (
                        <div className="px-5 pb-4 text-gray-500 text-sm leading-relaxed border-t border-gray-200 pt-3">
                            {item.answer}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
