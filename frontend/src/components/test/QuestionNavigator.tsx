import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface QuestionNavigatorProps {
    totalQuestions: number;
    currentIndex: number;
    onSelect: (index: number) => void;
    answeredIndices?: Set<number>;
    allowNavigation: boolean; // If false, bubbles are display-only (or only future disabled? usually disabled entirely for "cannot go back")
    startIndex?: number; // For display number offset
    orientation?: 'horizontal' | 'vertical';
    variant?: 'strip' | 'grid';
    onPrevious?: () => void;
    onNext?: () => void;
    isFirst?: boolean;
    isLast?: boolean;
    previousLabel?: string;
    nextLabel?: string;
}

export default function QuestionNavigator({
    totalQuestions,
    currentIndex,
    onSelect,
    answeredIndices = new Set(),
    allowNavigation,
    startIndex = 1,
    orientation = 'horizontal',
    variant = 'strip',
    onPrevious,
    onNext,
    isFirst = false,
    isLast = false,
    previousLabel = 'Previous',
    nextLabel = 'Next',
}: QuestionNavigatorProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to active question
    useEffect(() => {
        if (scrollContainerRef.current) {
            const activeBtn = scrollContainerRef.current.querySelector(`[data-question-index="${currentIndex}"]`) as HTMLElement | null;
            if (activeBtn) {
                const container = scrollContainerRef.current;
                if (variant === 'grid') {
                    const scrollTop = activeBtn.offsetTop - container.offsetHeight / 2 + activeBtn.offsetHeight / 2;
                    container.scrollTo({ top: scrollTop, behavior: 'smooth' });
                } else if (orientation === 'vertical') {
                    const scrollTop = activeBtn.offsetTop - container.offsetHeight / 2 + activeBtn.offsetHeight / 2;
                    container.scrollTo({ top: scrollTop, behavior: 'smooth' });
                } else {
                    const scrollLeft = activeBtn.offsetLeft - container.offsetWidth / 2 + activeBtn.offsetWidth / 2;
                    container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                }
            }
        }
    }, [currentIndex, orientation, variant]);

    if (variant === 'grid') {
        return (
            <div className="h-full w-full bg-[#e3e3e3] rounded-md border border-[#c8c8c8] p-4 flex flex-col">
                <div
                    ref={scrollContainerRef}
                    className="flex-1 min-h-0 overflow-y-auto scrollbar-hide"
                    style={{ scrollBehavior: 'smooth' }}
                >
                    <div className="grid grid-cols-5 gap-2.5">
                        {Array.from({ length: totalQuestions }).map((_, idx) => {
                            const isCurrent = idx === currentIndex;
                            const isAnswered = answeredIndices.has(idx);
                            const displayNumber = startIndex + idx;
                            const isClickable = allowNavigation;

                            return (
                                <button
                                    key={idx}
                                    data-question-index={idx}
                                    onClick={() => isClickable && onSelect(idx)}
                                    disabled={!isClickable}
                                    className={cn(
                                        "h-12 rounded-lg border text-xl leading-none font-medium transition-all",
                                        isCurrent
                                            ? "bg-[#f7f7f7] text-black border-[#4f4f4f] ring-2 ring-[#bdd4ff]"
                                        : isAnswered
                                                ? "bg-[#e8ecf4] text-gray-900 border-[#8f8f8f]"
                                                : "bg-[#e6e6e6] text-gray-900 border-[#8f8f8f] hover:bg-[#dddddd]",
                                        !isClickable && !isCurrent && "cursor-default opacity-80",
                                        !isClickable && isCurrent && "cursor-default"
                                    )}
                                >
                                    {displayNumber}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {(onPrevious || onNext) && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <button
                            onClick={onPrevious}
                            disabled={!onPrevious || isFirst}
                            className={cn(
                                "h-14 rounded-xl border text-xl font-medium transition-colors",
                                (!onPrevious || isFirst)
                                    ? "text-gray-400 border-[#b8b8b8] bg-[#e2e2e2] cursor-not-allowed"
                                    : "text-gray-900 border-[#8f8f8f] bg-[#e9e9e9] hover:bg-[#dedede]"
                            )}
                        >
                            {previousLabel}
                        </button>
                        <button
                            onClick={onNext}
                            disabled={!onNext || isLast}
                            className={cn(
                                "h-14 rounded-xl border px-2 text-base font-semibold transition-colors leading-tight",
                                (!onNext || isLast)
                                    ? "text-gray-400 border-[#b8b8b8] bg-[#e2e2e2] cursor-not-allowed"
                                    : "text-gray-900 border-[#8f8f8f] bg-[#e9e9e9] hover:bg-[#dedede]"
                            )}
                        >
                            {nextLabel}
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            className={cn(
                "bg-white",
                orientation === 'vertical'
                    ? "h-full w-full border-l border-gray-100"
                    : "w-full flex justify-center py-4 border-b border-gray-100"
            )}
        >
            <div
                ref={scrollContainerRef}
                className={cn(
                    "flex gap-2 scrollbar-hide",
                    orientation === 'vertical'
                        ? "h-full flex-col overflow-y-auto overflow-x-hidden py-3 px-2 snap-y items-center"
                        : "overflow-x-auto max-w-full px-4 snap-x"
                )}
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
                            data-question-index={idx}
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
