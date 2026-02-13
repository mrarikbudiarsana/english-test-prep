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
    const getNumberTileClass = (
        displayNumber: number,
        isCurrent: boolean,
        isAnswered: boolean,
        isClickable: boolean
    ) =>
        cn(
            "flex items-center justify-center rounded-[4px] border text-sm font-bold transition-colors duration-200",
            String(displayNumber).length > 2 ? "h-7 min-w-[2.5rem] px-2" : "h-7 w-7",
            isCurrent
                ? "bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-100 ring-offset-1"
                : isAnswered
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-white border-gray-300 text-gray-700 hover:border-gray-400",
            !isClickable && !isCurrent && "cursor-default opacity-80",
            !isClickable && isCurrent && "cursor-default"
        );

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
            <div className="w-full rounded-2xl border border-blue-100 bg-gradient-to-b from-white to-blue-50/60 p-3 shadow-sm">
                <div
                    ref={scrollContainerRef}
                    className="max-h-[24rem] overflow-y-auto scrollbar-hide pr-1"
                    style={{ scrollBehavior: 'smooth' }}
                >
                    <div className="grid grid-cols-5 justify-items-center gap-x-1.5 gap-y-2">
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
                                    className={getNumberTileClass(displayNumber, isCurrent, isAnswered, isClickable)}
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
                                "h-12 rounded-xl border text-base font-semibold transition-colors",
                                (!onPrevious || isFirst)
                                    ? "text-slate-400 border-slate-200 bg-slate-100 cursor-not-allowed"
                                    : "text-slate-700 border-slate-200 bg-white hover:bg-slate-50"
                            )}
                        >
                            {previousLabel}
                        </button>
                        <button
                            onClick={onNext}
                            disabled={!onNext || isLast}
                            className={cn(
                                "h-12 rounded-xl border px-2 text-base font-semibold transition-colors leading-tight",
                                (!onNext || isLast)
                                    ? "text-slate-400 border-slate-200 bg-slate-100 cursor-not-allowed"
                                    : "text-white border-blue-600 bg-blue-600 hover:bg-blue-700"
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
                    const isClickable = allowNavigation;

                    return (
                        <button
                            key={idx}
                            data-question-index={idx}
                            onClick={() => isClickable && onSelect(idx)}
                            disabled={!isClickable}
                            className={cn("flex-shrink-0 snap-center", getNumberTileClass(displayNumber, isCurrent, isAnswered, isClickable))}
                        >
                            {displayNumber}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
