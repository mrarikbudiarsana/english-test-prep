'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import QuestionEditor from '@/components/admin/QuestionEditor';
import { sectionTypeLabel, questionTypeLabel } from '@/lib/utils';
import type { Test, Section, Question } from '@/types/test';

export default function AdminSectionQuestionsPage() {
  const params = useParams();
  const testId = params.testId as string;
  const sectionId = params.sectionId as string;

  const [test, setTest] = useState<Test | null>(null);
  const [section, setSection] = useState<Section | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Question editor state
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [testRes, sectionsRes, questionsRes] = await Promise.all([
        api.get(`/admin/tests/${testId}`),
        api.get(`/tests/${testId}/sections`),
        api.get(`/admin/tests/${testId}/sections/${sectionId}/questions`),
      ]);

      setTest(testRes.data.data || testRes.data);

      const allSections = sectionsRes.data.data || sectionsRes.data;
      const currentSection = Array.isArray(allSections)
        ? allSections.find((s: Section) => s.id === sectionId)
        : null;
      setSection(currentSection || null);

      const fetchedQuestions = questionsRes.data.data || questionsRes.data;
      setQuestions(
        Array.isArray(fetchedQuestions)
          ? fetchedQuestions.sort((a: Question, b: Question) => a.questionNumber - b.questionNumber)
          : []
      );
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load section data');
    } finally {
      setLoading(false);
    }
  }, [testId, sectionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleQuestionSubmit = async (questionData: any) => {
    try {
      // Check if editingQuestion has an ID - if so, it's an update, otherwise it's a create
      if (editingQuestion && editingQuestion.id) {
        const response = await api.put(
          `/admin/tests/${testId}/sections/${sectionId}/questions/${editingQuestion.id}`,
          questionData
        );
        const updated = response.data.data || response.data;
        setQuestions((prev) =>
          prev
            .map((q) => (q.id === editingQuestion.id ? updated : q))
            .sort((a, b) => a.questionNumber - b.questionNumber)
        );
      } else {
        const response = await api.post(
          `/admin/tests/${testId}/sections/${sectionId}/questions`,
          questionData
        );
        const created = response.data.data || response.data;
        setQuestions((prev) =>
          [...prev, created].sort((a, b) => a.questionNumber - b.questionNumber)
        );
      }
      setShowQuestionEditor(false);
      setEditingQuestion(null);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save question');
      throw err;
    }
  };

  const handleQuestionDelete = async (questionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (
      !window.confirm(
        `Are you sure you want to delete question ${question?.questionNumber || ''}? This cannot be undone.`
      )
    ) {
      return;
    }
    setDeletingQuestionId(questionId);
    try {
      await api.delete(
        `/admin/tests/${testId}/sections/${sectionId}/questions/${questionId}`
      );
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete question');
    } finally {
      setDeletingQuestionId(null);
    }
  };

  const openEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setShowQuestionEditor(true);
  };

  const openNewQuestion = () => {
    // Auto-fill group info from the last question (if any) for easier IELTS-style grouping
    const lastQuestion = questions.length > 0 ? questions[questions.length - 1] : null;
    const prefillData = lastQuestion?.groupLabel ? {
      groupLabel: lastQuestion.groupLabel,
      groupInstructions: lastQuestion.groupInstructions,
      // Note: Don't prefill title - only first question in group should have it
    } : {};

    setEditingQuestion({ ...prefillData } as any);
    setShowQuestionEditor(true);
  };

  const getQuestionTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      multiple_choice: 'info',
      true_false_not_given: 'warning',
      yes_no_not_given: 'warning',
      completion: 'success',
      matching: 'error',
      dropdown: 'default',
    };
    return colors[type] || 'default';
  };

  const getQuestionPreview = (question: Question): string => {
    const text = question.questionText || '';
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="text" width="50%" height={32} />
        <Card>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rect" height={64} />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (error || !section) {
    return (
      <div className="space-y-6">
        <Link
          href={`/admin/tests/${testId}`}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          &larr; Back to Test
        </Link>
        <Card>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error || 'Section not found'}</p>
            <button onClick={fetchData} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Try again
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // Calculate next question number accounting for multi-select MCQs that consume multiple numbers
  // e.g., "Choose TWO" question 11 displays as 11-12, so next should be 13
  const nextQuestionNumber = questions.length > 0
    ? questions.reduce((maxEnd, q) => {
      const qData = q.questionData as any;
      const consumed = (q.questionType === 'multiple_choice' && qData?.multiSelect)
        ? (qData.expectedAnswers || 2)
        : 1;
      const questionEnd = q.questionNumber + consumed - 1;
      return Math.max(maxEnd, questionEnd);
    }, 0) + 1
    : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/tests/${testId}`}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {section.title || `Section ${section.sectionOrder}`}
          </h1>
          <p className="text-sm text-gray-500">
            {sectionTypeLabel(section.sectionType)} | Order: {section.sectionOrder} | {section.durationMinutes} min
          </p>
        </div>
      </div>

      {/* Section Info */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="info">{sectionTypeLabel(section.sectionType)}</Badge>
              <span className="text-sm text-gray-500">{questions.length} question{questions.length !== 1 ? 's' : ''}</span>
            </div>
            {section.instructions && (
              <p className="text-sm text-gray-600 max-w-2xl">{section.instructions}</p>
            )}
          </div>
          <Button onClick={openNewQuestion}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Question
          </Button>
        </div>
      </Card>

      {/* Questions List */}
      {questions.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
            <p className="text-gray-500 mb-4">No questions in this section yet.</p>
            <Button onClick={openNewQuestion}>Add First Question</Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((question) => (
            <Card
              key={question.id}
              className={question.groupLabel ? 'border-l-4 border-l-blue-400' : ''}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                    {question.questionNumber}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getQuestionTypeColor(question.questionType) as any}>
                        {questionTypeLabel(question.questionType)}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {question.points} pt{question.points !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{getQuestionPreview(question)}</p>
                    {question.groupLabel && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          📑 {question.groupLabel}
                        </span>
                        {question.groupInstructions && (
                          <span className="text-xs text-gray-400" title={question.groupInstructions}>
                            (has shared instructions)
                          </span>
                        )}
                      </div>
                    )}
                    {question.correctAnswer !== undefined && question.correctAnswer !== null && (
                      <p className="text-xs text-green-600 mt-1">
                        Answer: {typeof question.correctAnswer === 'object'
                          ? JSON.stringify(question.correctAnswer)
                          : String(question.correctAnswer)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openEditQuestion(question)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuestionDelete(question.id)}
                    loading={deletingQuestionId === question.id}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Question Editor Modal */}
      <Modal
        isOpen={showQuestionEditor}
        onClose={() => {
          setShowQuestionEditor(false);
          setEditingQuestion(null);
        }}
        title={
          editingQuestion && editingQuestion.id
            ? `Edit Question ${editingQuestion.questionNumber}`
            : editingQuestion?.groupLabel
              ? `Add New Question (Group: ${editingQuestion.groupLabel})`
              : 'Add New Question'
        }
        size="lg"
      >
        <QuestionEditor
          sectionId={sectionId}
          testType={test?.testType}
          sectionType={section?.sectionType}
          partNumber={section?.partNumber ?? undefined}
          initialData={
            editingQuestion && editingQuestion.id
              ? {
                id: editingQuestion.id,
                questionNumber: editingQuestion.questionNumber,
                questionType: editingQuestion.questionType,
                questionText: editingQuestion.questionText,
                questionData: editingQuestion.questionData,
                correctAnswer: editingQuestion.correctAnswer,
                points: editingQuestion.points,
                explanation: editingQuestion.explanation || null,
                groupLabel: editingQuestion.groupLabel || null,
                groupInstructions: editingQuestion.groupInstructions || null,
              }
              : editingQuestion
                ? {
                  groupLabel: editingQuestion.groupLabel || null,
                  groupInstructions: editingQuestion.groupInstructions || null,
                }
                : undefined
          }
          nextQuestionNumber={nextQuestionNumber}
          onSubmit={handleQuestionSubmit}
          onCancel={() => {
            setShowQuestionEditor(false);
            setEditingQuestion(null);
          }}
        />
      </Modal>
    </div>
  );
}
