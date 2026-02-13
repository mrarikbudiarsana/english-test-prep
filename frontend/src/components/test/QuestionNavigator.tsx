import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface QuestionNavigatorProps {
    totalQuestions: number;
    currentIndex: number;
    onSelect: (index: number) => void;
    answeredIndices?: Set<number>;
    allowNavigation: boolean; // If false, bubbles are display-only (or only future disabled? usually disabled entirely for "cannot go back")
    startIndex?: number; // For display number offset
}

export default function QuestionNavigator({
    totalQuestions,
    currentIndex,
    onSelect,
    answeredIndices = new Set(),
    allowNavigation,
    startIndex = 1,
}: QuestionNavigatorProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to active question
    useEffect(() => {
        if (scrollContainerRef.current) {
            const activeBtn = scrollContainerRef.current.children[currentIndex] as HTMLElement;
            if (activeBtn) {
                const container = scrollContainerRef.current;
                const scrollLeft = activeBtn.offsetLeft - container.offsetWidth / 2 + activeBtn.offsetWidth / 2;
                container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
            }
        }
    }, [currentIndex]);

    return (
        <div className="w-full flex justify-center py-4 bg-white border-b border-gray-100">
            <div
                ref={scrollContainerRef}
                className="flex gap-2 overflow-x-auto max-w-full px-4 scrollbar-hide snap-x"
                style={{ scrollBehavior: 'smooth' }}
            >
                {Array.from({ length: totalQuestions }).map((_, idx) => {
                    const isCurrent = idx === currentIndex;
                    const isAnswered = answeredIndices.has(idx);
                    const displayNumber = startIndex + idx;

                    // Logic for clickability:
                    // If navigation is allowed (Structure/Reading), all are clickable.
                    // If not allowed (Listening), NONE are clickable (view only status), OR maybe only previous are disabled? 
                    // Requirement: "ss cannot go back". 
                    // So for Listening: cannot Click previous. Future? Usually blocked until reached.
                    // Simplest interpretation: Listening = View Only tracking.
                    const isClickable = allowNavigation;

                    return (
                        <button
                            key={idx}
                            onClick={() => isClickable && onSelect(idx)}
                            disabled={!isClickable}
                            className={cn(
                                "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all snap-center",
                                isCurrent
                                    ? "bg-blue-600 text-white shadow-md scale-105 ring-2 ring-blue-200"
                                    : isAnswered
                                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                                        : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300",
                                !isClickable && !isCurrent && "cursor-default hover:border-gray-200 opacity-80", // Visual style for non-clickable
                                !isClickable && isCurrent && "cursor-default"
                            )}
                        >
                            {displayNumber}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
