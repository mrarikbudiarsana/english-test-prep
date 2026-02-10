'use client';

import React from 'react';
import { Question } from '@/types/test';
import { ChevronLeft, ChevronRight, Flag } from 'lucide-react';

interface TestFooterProps {
    questions: Question[];
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
                    <div className="flex items-center justify-center gap-1.5 min-w-max p-1">
                        {questions.map((question, index) => {
                            const isActive = index === currentQuestionIndex;
                            const isAnswered = answeredQuestions.has(question.id);
                            const isFlagged = flaggedQuestions.has(question.id);

                            let buttonClass = 'min-w-[2rem] h-8 rounded-md text-xs font-medium transition-all relative ';

                            if (isActive) {
                                buttonClass += 'bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-1';
                            } else if (isAnswered) {
                                buttonClass += 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200';
                            } else {
                                buttonClass += 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200';
                            }

                            return (
                                <button
                                    key={question.id}
                                    onClick={() => onQuestionSelect(index)}
                                    className={buttonClass}
                                    aria-label={`Question ${question.questionNumber}`}
                                >
                                    {question.questionNumber}
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
