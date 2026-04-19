import React, { useRef, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

interface QuestionNavigatorProps {
    totalQuestions: number;
    currentIndex: number;
    onSelect: (index: number) => void;
    answeredIndices?: Set<number>;
    flaggedIndices?: Set<number>;
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
    pageSize?: number;
    hideActions?: boolean;
}

export default function QuestionNavigator({
    totalQuestions,
    currentIndex,
    onSelect,
    answeredIndices = new Set(),
    flaggedIndices = new Set(),
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
    pageSize = 50,
    hideActions = false,
}: QuestionNavigatorProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [gridPage, setGridPage] = useState(1);
    const getNumberTileClass = (
        displayNumber: number,
        isCurrent: boolean,
        isAnswered: boolean,
        isClickable: boolean
    ) =>
        cn(
            "flex items-center justify-center rounded-md border text-sm font-bold transition-all duration-200",
            String(displayNumber).length > 2 ? "h-8 min-w-[2rem] px-1" : "h-8 w-8",
            isCurrent
                ? "bg-[#08507f] border-[#08507f] text-white shadow-md ring-2 ring-[#08507f]/10 ring-offset-1"
                : isAnswered
                    ? "bg-[#08507f] border-[#08507f] text-white"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50",
            !isClickable && !isCurrent && "cursor-default opacity-80",
            !isClickable && isCurrent && "cursor-default"
        );

    const totalPages = Math.max(1, Math.ceil(totalQuestions / pageSize));
    const currentPage = Math.min(totalPages, Math.max(1, Math.ceil((currentIndex + 1) / pageSize)));
    const pageStart = (gridPage - 1) * pageSize;
    const pageEnd = Math.min(totalQuestions, pageStart + pageSize);

    const visibleIndices = useMemo(
        () => Array.from({ length: Math.max(0, pageEnd - pageStart) }, (_, i) => pageStart + i),
        [pageStart, pageEnd]
    );

    const answeredCount = answeredIndices.size;

    // Keep page synced only when current question is outside the visible page.
    useEffect(() => {
        if (variant !== 'grid') return;
        if (currentIndex < pageStart || currentIndex >= pageEnd) {
            setGridPage(currentPage);
        }
    }, [variant, currentIndex, pageStart, pageEnd, currentPage]);

    // Auto-scroll to active question (non-grid variants).
    useEffect(() => {
        if (variant === 'grid') return;
        if (scrollContainerRef.current) {
            const activeBtn = scrollContainerRef.current.querySelector(`[data-question-index="${currentIndex}"]`) as HTMLElement | null;
            if (activeBtn) {
                const container = scrollContainerRef.current;
                if (orientation === 'vertical') {
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
            <div className="w-full">
                {totalPages > 1 && (
                    <div className="mb-4 flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-2 py-1.5">
                        <button
                            onClick={() => setGridPage((p) => Math.max(1, p - 1))}
                            disabled={gridPage <= 1}
                            className={cn(
                                "h-8 rounded-md border px-2 text-xs font-medium transition-colors",
                                gridPage <= 1
                                    ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300"
                                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                            )}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-tight">
                            Questions {pageStart + 1} - {pageEnd}
                        </span>
                        <button
                            onClick={() => setGridPage((p) => Math.min(totalPages, p + 1))}
                            disabled={gridPage >= totalPages}
                            className={cn(
                                "h-8 rounded-md border px-2 text-xs font-medium transition-colors",
                                gridPage >= totalPages
                                    ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300"
                                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                            )}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-6 gap-2">
                    {visibleIndices.map((idx) => {
                        const isCurrent = idx === currentIndex;
                        const isAnswered = answeredIndices.has(idx);
                        const isFlagged = flaggedIndices.has(idx);
                        const displayNumber = startIndex + idx;
                        const isClickable = allowNavigation;

                        return (
                            <button
                                key={idx}
                                data-question-index={idx}
                                onClick={() => isClickable && onSelect(idx)}
                                disabled={!isClickable}
                                className={cn(
                                    "flex items-center justify-center rounded-sm border-2 text-[13px] font-semibold transition-all duration-150 h-10 w-full",
                                    isCurrent
                                        ? isFlagged
                                            ? "bg-white border-[#f59e0b] text-[#f59e0b] shadow-md ring-2 ring-[#f59e0b]/20"
                                            : "bg-white border-[#08507f] text-[#08507f] shadow-sm"
                                        : isFlagged
                                            ? "bg-[#f59e0b] border-[#f59e0b] text-white shadow-sm"
                                            : isAnswered
                                                ? "bg-[#08507f] border-[#08507f] text-white"
                                                : "bg-white border-gray-200 text-gray-400 hover:border-gray-300",
                                    !isClickable && !isCurrent && "cursor-default opacity-50",
                                    !isClickable && isCurrent && "cursor-default"
                                )}
                            >
                                {displayNumber}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[13px] font-semibold text-[#08507f] opacity-80">
                        {answeredCount} of {totalQuestions} answered
                    </p>
                </div>
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
