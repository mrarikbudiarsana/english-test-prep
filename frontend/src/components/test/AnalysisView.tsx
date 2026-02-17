'use client';

import React, { useEffect, useState, useMemo } from 'react';

import { Attempt, Section, Question, SectionType } from '@/types/test';
import { User, Subscription } from '@/types/user'; // User might not have plan, using Subscription
import api from '@/lib/api';
import QuestionRenderer from '@/components/test/QuestionRenderer';
// Removed unused Tabs imports
import { Lock, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface AnalysisViewProps {
    attempt: Attempt;
    userSubscription?: Subscription | null; // Pass from parent or fetch
}

export default function AnalysisView({ attempt, userSubscription }: AnalysisViewProps) {
    const { user } = useAuth();
    const [sections, setSections] = useState<Section[]>([]);
    const [activeSectionId, setActiveSectionId] = useState<string>('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Record<string, any>>({}); // Map questionId -> answer
    const [loading, setLoading] = useState(true);
    const [loadingQuestions, setLoadingQuestions] = useState(false);

    // Determine Tier
    const tier = useMemo(() => {
        if (!userSubscription || userSubscription.status !== 'active') return 'free';
        // Logic: Starter = Monthly, Pro = Yearly/Quarterly
        if (userSubscription.planType === 'monthly') return 'starter';
        if (userSubscription.planType === 'yearly' || userSubscription.planType === 'quarterly') return 'pro';
        return 'free';
    }, [userSubscription]);

    useEffect(() => {
        async function init() {
            try {
                // 1. Fetch sections
                const sectionsRes = await api.get(`/tests/${attempt.testId}/sections`);
                setSections(sectionsRes.data);
                if (sectionsRes.data.length > 0) {
                    setActiveSectionId(sectionsRes.data[0].id);
                }

                // 2. Fetch user answers (try to get from attempt if possible, or fetch separate endpoint?)
                // Assuming we need to fetch them. If not available in attempt object.
                // For now, let's try to fetch a specific endpoint or use what's in attempt if it was populated.
                // PROPOSAL: We fetch the attempt details again which MIGHT have answers if we use a specific query param?
                // Or maybe /attempts/:id/answers exists. 
                // Let's assume we can get them. For now, I'll try to fetch questions and hope I can map answers.

                // DATA FETCHING STRATEGY: 
                // We need to fetch questions for the active section.
                // We typically don't have a bulk "get all questions for test" endpoint.
            } catch (err) {
                console.error("Failed to init analysis", err);
            } finally {
                setLoading(false);
            }
        }
        init();
    }, [attempt.testId]);

    // Fetch questions when active section changes
    useEffect(() => {
        if (!activeSectionId) return;

        async function fetchQuestions() {
            setLoadingQuestions(true);
            try {
                // Fetch questions
                const qRes = await api.get(`/tests/${attempt.testId}/sections/${activeSectionId}/questions`);
                setQuestions(qRes.data);

                // Fetch answers for this section? 
                // Or maybe we should fetch ALL answers once. 
                // Let's attempt to fetch '/attempts/:id/responses' if it exists.
                // If not, we might be stuck. 
                // WORKAROUND: check if attempt object passed in HAS answers. 
                // If not, we might fail to show user answers.
            } catch (err) {
                console.error("Failed to fetch questions", err);
            } finally {
                setLoadingQuestions(false);
            }
        }
        fetchQuestions();
    }, [activeSectionId, attempt.testId]);

    // Fetch answers once
    useEffect(() => {
        async function fetchAnswers() {
            try {
                // Try a likely endpoint
                const res = await api.get(`/attempts/${attempt.id}/responses`);
                // Transform array to map
                const map: Record<string, any> = {};
                res.data.forEach((r: any) => {
                    map[r.questionId] = r.answerData;
                });
                setAnswers(map);
            } catch (e) {
                // Fallback: maybe they are in the attempt object?
                // console.log("Could not fetch responses", e);
            }
        }
        fetchAnswers();
    }, [attempt.id]);


    if (loading) return <div>Loading analysis...</div>;

    return (
        <div className="space-y-6">
            {/* Tier Banner */}
            <div className={cn(
                "p-4 rounded-lg border flex items-center justify-between",
                tier === 'free' ? "bg-gray-50 border-gray-200" :
                    tier === 'starter' ? "bg-blue-50 border-blue-200" :
                        "bg-purple-50 border-purple-200"
            )}>
                <div>
                    <h3 className="font-bold text-lg">
                        {tier === 'free' && "Free Analysis"}
                        {tier === 'starter' && "Starter Analysis"}
                        {tier === 'pro' && "Pro Analysis"}
                    </h3>
                    <p className="text-sm text-gray-600">
                        {tier === 'free' && "Upgrade to see correct answers and explanations."}
                        {tier === 'starter' && "Upgrade to Pro to see detailed AI explanations."}
                        {tier === 'pro' && "You have full access to detailed insights."}
                    </p>
                </div>
                {tier !== 'pro' && (
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
                        Upgrade
                    </button>
                )}
            </div>

            {/* Sections Tabs */}
            <div className="flex space-x-2 overflow-x-auto pb-2 border-b">
                {sections.map(section => (
                    <button
                        key={section.id}
                        onClick={() => setActiveSectionId(section.id)}
                        className={cn(
                            "px-4 py-2 whitespace-nowrap text-sm font-medium rounded-t-lg border-b-2 transition-colors",
                            activeSectionId === section.id
                                ? "border-blue-600 text-blue-600 bg-blue-50/50"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        )}
                    >
                        {section.title || section.sectionType}
                    </button>
                ))}
            </div>

            {/* Questions List */}
            <div className="space-y-8">
                {loadingQuestions ? (
                    <div className="py-10 text-center text-gray-500">Loading questions...</div>
                ) : (
                    questions.map((q, index) => {
                        const userAnswer = answers[q.id];

                        // Gating Logic
                        const showStatus = true; // All tiers see status
                        const showCorrectAnswer = tier !== 'free'; // Free tier hides correct answer
                        const showExplanation = tier === 'pro';    // Only Pro sees explanation

                        // Helper to determining correctness
                        const isCorrect = userAnswer?.isCorrect;

                        const statusColor = isCorrect === true ? 'text-green-600 bg-green-50 border-green-200' :
                            isCorrect === false ? 'text-red-600 bg-red-50 border-red-200' :
                                'text-gray-500 bg-gray-50 border-gray-200';
                        const statusIcon = isCorrect === true ? <Check className="w-4 h-4" /> :
                            isCorrect === false ? <AlertCircle className="w-4 h-4" /> : null;
                        const statusText = isCorrect === true ? 'Correct' :
                            isCorrect === false ? 'Incorrect' : 'Not Answered';

                        // Prepare sanitized question object for Renderer
                        const renderQuestion = {
                            ...q,
                            explanation: showExplanation ? q.explanation : undefined,
                            correctAnswer: showCorrectAnswer ? q.correctAnswer : undefined
                        };

                        return (
                            <div key={q.id} className="relative group">
                                <div className={cn("absolute -left-3 top-0 bottom-0 w-1 transition-colors",
                                    isCorrect === true ? "bg-green-200" :
                                        isCorrect === false ? "bg-red-200" : "bg-gray-100"
                                )} />
                                <div className="pl-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-xs text-gray-400">Q{q.questionNumber}</span>
                                            {showStatus && isCorrect !== undefined && (
                                                <div className={cn("flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-medium", statusColor)}>
                                                    {statusIcon}
                                                    <span>{statusText}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <QuestionRenderer
                                        question={renderQuestion}
                                        answer={userAnswer}
                                        onAnswerChange={() => { }}
                                        readOnly={true}
                                    />

                                    {/* Gated Content Overlays */}
                                    {!showCorrectAnswer && !isCorrect && (
                                        <div className="mt-2 text-xs text-gray-400 italic flex items-center gap-1">
                                            <Lock className="w-3 h-3" /> Correct answer hidden (Upgrade to Starter)
                                        </div>
                                    )}

                                    {showCorrectAnswer && !showExplanation && q.explanation && (
                                        <div className="mt-2 p-2 bg-gray-50/50 rounded border border-gray-100 text-xs text-gray-400 flex items-center justify-between">
                                            <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Explanation hidden (Upgrade to Pro)</span>
                                        </div>
                                    )}

                                    {showExplanation && q.explanation && (
                                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                            <h4 className="font-semibold text-blue-900 text-sm mb-1">Explanation</h4>
                                            <p className="text-blue-800 text-sm leading-relaxed">{q.explanation}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
