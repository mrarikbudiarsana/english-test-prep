'use client';

import React, { useState, useEffect } from 'react';
import { Question, Section } from '@/types/test';
import { ChevronLeft, ChevronRight, Flag } from 'lucide-react';

interface TestFooterProps {
    questions: Question[];
    sections: Section[];
    currentQuestionIndex: number;
    answeredQuestions: Set<string>;
    flaggedQuestions: Set<string>;
    onQuestionSelect: (index: number) => void;
    onNext: () => void;
    onPrevious: () => void;
    isFirst: boolean;
    isLast: boolean;
    onToggleFlag: (questionId: string) => void;
}

export default function TestFooter({
    questions,
    sections,
    currentQuestionIndex,
    answeredQuestions,
    flaggedQuestions,
    onQuestionSelect,
    onNext,
    onPrevious,
    isFirst,
    isLast,
    onToggleFlag,
}: TestFooterProps) {
    const currentQuestion = questions[currentQuestionIndex];

    // Group questions by section (Part)
    const groupedQuestions = sections.map((section, sectionIdx) => ({
        section,
        questions: questions.filter(q => q.sectionId === section.id),
        partLabel: `Part ${sectionIdx + 1}`
    })).filter(group => group.questions.length > 0);

    // If no sections (or single section), fall back to simple list
    const hasMultipleParts = groupedQuestions.length > 1;

    // Track which parts are expanded (show question numbers)
    const [expandedParts, setExpandedParts] = useState<Set<number>>(
        new Set(groupedQuestions.map((_, idx) => idx)) // All expanded by default
    );

    // Auto-expand the part containing the current question
    useEffect(() => {
        if (currentQuestion && hasMultipleParts) {
            const partIdx = groupedQuestions.findIndex(g =>
                g.questions.some(q => q.id === currentQuestion.id)
            );
            if (partIdx !== -1) {
                setExpandedParts(prev => new Set(prev).add(partIdx));
            }
        }
    }, [currentQuestion?.id, hasMultipleParts]);

    const togglePart = (partIdx: number) => {
        setExpandedParts(prev => {
            const next = new Set(prev);
            if (next.has(partIdx)) {
                next.delete(partIdx);
            } else {
                next.add(partIdx);
            }
            return next;
        });
    };

    return (
        <div className="bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
                {/* Previous Button */}
                <button
                    onClick={onPrevious}
                    disabled={isFirst}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
            ${isFirst
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Previous
                </button>

                {/* Question Navigation Scroll Area */}
                <div className="flex-1 overflow-x-auto no-scrollbar mx-4">
                    <div className="flex items-center justify-center gap-4 min-w-max p-1">
                        {(hasMultipleParts ? groupedQuestions : [{ questions }]).map((group, groupIdx) => {
                            const isExpanded = !hasMultipleParts || expandedParts.has(groupIdx);
                            return (
                            <div key={groupIdx} className="flex items-center gap-2">
                                {hasMultipleParts && (
                                    <button
                                        onClick={() => togglePart(groupIdx)}
                                        className="text-[10px] font-bold text-gray-500 hover:text-gray-700 uppercase tracking-wider mr-1 whitespace-nowrap transition-colors cursor-pointer px-1.5 py-0.5 rounded hover:bg-gray-100"
                                    >
                                        {(group as any).partLabel}
                                    </button>
                                )}
                                {isExpanded && (
                                <div className="flex items-center gap-1.5">
                                    {group.questions.map((question) => {
                                        const index = questions.indexOf(question);
                                        const isActive = index === currentQuestionIndex;
                                        const isAnswered = answeredQuestions.has(question.id);
                                        const isFlagged = flaggedQuestions.has(question.id);

                                        // Calculate display label (handle multi-point ranges)
                                        // Note: We need a reliable way to know the "start number" for this footer item.
                                        // Since we don't have the global offset here easily without passing it down, 
                                        // we can approximate or require the parent to pass a label generator. 
                                        // However, standard continuous index + 1 is usually close enough for footer navigation unless we have complex offsets.
                                        // Better approach: calculate based on cumulative points up to this question.

                                        // Calculating exact range label inside render loop is expensive if we re-scan everything. 
                                        // Simplified active state: The parent knows the true display text (passed to QuestionRenderer).
                                        // But here we just need a button. 
                                        // Let's rely on simple 1-based index or just show the index+1 for now, 
                                        // UNLESS points > 1, then we try to show range.
                                        // Actually, typically the footer just shows "Question number" (1, 2, 3...) separately.
                                        // But user requested "displayed numbers like 11 & 12". 
                                        // If Q11 is 2 points, it covers 11-12.

                                        // Let's implement a quick helper to get the visual label if possible.
                                        // For footer, usually simple numbers are preferred to avoid clutter 20-21, 22-23...
                                        // But if requested, we should try. 
                                        // For now, let's keep it simple: Show the "Question Index + 1" but clearly point to the question.
                                        // Wait, if Q20 is 2 points (20-21), then the NEXT question is Q22. 
                                        // So grouping is essential.

                                        // Let's PRE-CALCULATE the start numbers for all questions to be safe.
                                        // Or just use the question.questionNumber if available/reliable.
                                        const qNum = question.questionNumber; // This might be reliable if backend sets it correctly. 
                                        // If backend sets questionNumber=20 for a 2-point question, does the next one have 22?
                                        // Assuming yes. Then we just check points.

                                        const points = question.points || 1;
                                        const label = points > 1 ? `${qNum}-${qNum + points - 1}` : qNum;

                                        let buttonClass = 'min-w-[2rem] h-8 px-2 rounded-md text-xs font-medium transition-all relative flex items-center justify-center ';

                                        if (isActive) {
                                            buttonClass += 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-200';
                                        } else if (isAnswered) {
                                            buttonClass += 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100';
                                        } else {
                                            buttonClass += 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50';
                                        }

                                        return (
                                            <button
                                                key={question.id}
                                                onClick={() => onQuestionSelect(index)}
                                                className={buttonClass}
                                                aria-label={`Question ${label}`}
                                            >
                                                {label}
                                                {isFlagged && (
                                                    <div className="absolute -top-1 -right-1">
                                                        <div className="bg-orange-500 rounded-full p-0.5 shadow-sm">
                                                            <Flag className="w-2 h-2 text-white fill-current" />
                                                        </div>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                )}
                                {hasMultipleParts && groupIdx < groupedQuestions.length - 1 && (
                                    <div className="h-4 w-[1px] bg-gray-200 mx-2" />
                                )}
                            </div>
                        )})}

                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                    {currentQuestion && (
                        <button
                            onClick={() => onToggleFlag(currentQuestion.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border
                ${flaggedQuestions.has(currentQuestion.id)
                                    ? 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <Flag className={`w-3.5 h-3.5 ${flaggedQuestions.has(currentQuestion.id) ? 'fill-current' : ''}`} />
                            {flaggedQuestions.has(currentQuestion.id) ? 'Flagged' : 'Flag'}
                        </button>
                    )}

                    <button
                        onClick={onNext}
                        disabled={isLast}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
              ${isLast
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                            }`}
                    >
                        Next
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
