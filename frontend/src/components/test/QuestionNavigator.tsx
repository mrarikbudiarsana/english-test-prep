import React, { useRef, useEffect, useMemo, useState } from 'react';
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
    pageSize?: number;
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
    pageSize = 50,
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
                ? "bg-blue-600 border-blue-600 text-white shadow-md ring-2 ring-blue-100 ring-offset-1"
                : isAnswered
                    ? "bg-emerald-100 border-emerald-200 text-emerald-700"
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
            <div className="w-full rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                {totalPages > 1 && (
                    <div className="mb-2 flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-2 py-1.5">
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
                            Previous Page
                        </button>
                        <span className="text-xs font-medium text-gray-600">
                            Page {gridPage} / {totalPages}
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
                            Next Page
                        </button>
                    </div>
                )}

                <div className="pr-1">
                    <div className="grid grid-cols-5 justify-items-center gap-2">
                        {visibleIndices.map((idx) => {
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
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                            onClick={onPrevious}
                            disabled={!onPrevious || isFirst}
                            className={cn(
                                "h-10 rounded-lg border text-sm font-medium transition-colors",
                                (!onPrevious || isFirst)
                                    ? "text-gray-300 border-gray-100 bg-gray-50 cursor-not-allowed"
                                    : "text-gray-700 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300"
                            )}
                        >
                            {previousLabel}
                        </button>
                        <button
                            onClick={onNext}
                            disabled={!onNext || isLast}
                            className={cn(
                                "h-10 rounded-lg border px-2 text-sm font-medium transition-colors leading-tight shadow-sm",
                                (!onNext || isLast)
                                    ? "text-gray-300 border-gray-100 bg-gray-50 cursor-not-allowed shadow-none"
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
