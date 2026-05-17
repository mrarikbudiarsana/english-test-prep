'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Sparkles, Volume2, VolumeX } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import QuestionEditor from '@/components/admin/QuestionEditor';
import BulkQuestionImporter from '@/components/admin/BulkQuestionImporter';
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
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatingBulk, setGeneratingBulk] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [syncingBulk, setSyncingBulk] = useState(false);
  const [showBulkImporter, setShowBulkImporter] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [deletingBulk, setDeletingBulk] = useState(false);

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
      setSection(Array.isArray(allSections) ? allSections.find((item: Section) => item.id === sectionId) || null : null);
      const fetchedQuestions = questionsRes.data.data || questionsRes.data;
      setQuestions(Array.isArray(fetchedQuestions) ? fetchedQuestions.sort((a: Question, b: Question) => a.questionNumber - b.questionNumber) : []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load section data');
    } finally {
      setLoading(false);
    }
  }, [sectionId, testId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const nextQuestionNumber = questions.length > 0 ? Math.max(...questions.map((q) => q.questionNumber)) + 1 : 1;

  const handleQuestionSubmit = async (questionData: any) => {
    try {
      if (editingQuestion?.id) {
        const response = await api.put(`/admin/tests/${testId}/sections/${sectionId}/questions/${editingQuestion.id}`, questionData);
        const updated = response.data.data || response.data;
        setQuestions((prev) => prev.map((question) => question.id === editingQuestion.id ? updated : question).sort((a, b) => a.questionNumber - b.questionNumber));
      } else {
        const response = await api.post(`/admin/tests/${testId}/sections/${sectionId}/questions`, questionData);
        const created = response.data.data || response.data;
        setQuestions((prev) => [...prev, created].sort((a, b) => a.questionNumber - b.questionNumber));
      }
      setShowQuestionEditor(false);
      setEditingQuestion(null);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save question');
      throw err;
    }
  };

  const handleQuestionDelete = async (questionId: string) => {
    if (!window.confirm('Delete this question? This cannot be undone.')) return;
    setDeletingQuestionId(questionId);
    try {
      await api.delete(`/admin/tests/${testId}/sections/${sectionId}/questions/${questionId}`);
      setQuestions((prev) => prev.filter((question) => question.id !== questionId));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete question');
    } finally {
      setDeletingQuestionId(null);
    }
  };
  
  const handleGenerateAIExplanation = async (questionId: string) => {
    setGeneratingId(questionId);
    try {
      const res = await api.post(`/admin/questions/${questionId}/generate-explanation`);
      const explanation = res.data.explanation;
      setQuestions((prev) => prev.map((q) => q.id === questionId ? { ...q, explanationAi: explanation } : q));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to generate AI explanation');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleBulkGenerateAI = async () => {
    const missing = questions.filter((q) => !q.explanationAi);
    if (missing.length === 0) {
      alert('All questions already have AI explanations.');
      return;
    }
    if (!window.confirm(`Generate AI explanations for ${missing.length} questions? This may take a minute.`)) return;

    setGeneratingBulk(true);
    let successCount = 0;

    for (const q of missing) {
      try {
        setGeneratingId(q.id);
        const res = await api.post(`/admin/questions/${q.id}/generate-explanation`);
        const explanation = res.data.explanation;
        setQuestions((prev) => prev.map((item) => item.id === q.id ? { ...item, explanationAi: explanation } : item));
        successCount++;
      } catch (err) {
        console.error(`Failed for Q${q.questionNumber}:`, err);
      }
    }

    setGeneratingId(null);
    setGeneratingBulk(false);
    alert(`Successfully generated ${successCount} explanations.`);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedQuestionIds(questions.map((q) => q.id));
    } else {
      setSelectedQuestionIds([]);
    }
  };

  const handleSelectQuestion = (questionId: string, checked: boolean) => {
    if (checked) {
      setSelectedQuestionIds((prev) => [...prev, questionId]);
    } else {
      setSelectedQuestionIds((prev) => prev.filter((id) => id !== questionId));
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedQuestionIds.length} selected questions? This cannot be undone.`)) return;
    setDeletingBulk(true);
    let successCount = 0;
    
    for (const id of selectedQuestionIds) {
      try {
        await api.delete(`/admin/tests/${testId}/sections/${sectionId}/questions/${id}`);
        successCount++;
      } catch (err) {
        console.error(`Failed to delete Q${id}:`, err);
      }
    }
    
    setQuestions((prev) => prev.filter((q) => !selectedQuestionIds.includes(q.id)));
    setSelectedQuestionIds([]);
    setDeletingBulk(false);
    if (successCount > 0 && successCount < selectedQuestionIds.length) {
      alert(`Deleted ${successCount} out of ${selectedQuestionIds.length} questions.`);
    }
  };

  const handleBulkImport = async (bulkQuestions: Array<{ questionText: string; options: { key: string; text: string }[]; correctAnswer: string; explanation?: string; questionNumber?: number; }>) => {
    const response = await api.post(`/admin/sections/${sectionId}/questions/bulk`, { questions: bulkQuestions });
    const result = response.data.data || response.data;
    const created = result.questions || [];
    setQuestions((prev) => [...prev, ...created].sort((a: Question, b: Question) => a.questionNumber - b.questionNumber));
    setShowBulkImporter(false);
  };

  const handleBulkSyncUnderlines = async () => {
    const toFix = questions.filter(q => q.questionType === 'multiple_choice' && !q.questionText?.includes('<u>') && q.questionData?.options?.length === 4 && q.questionNumber >= 16);
    if (toFix.length === 0) {
      alert('No questions found that need auto-underlining.');
      return;
    }
    if (!window.confirm(`Found ${toFix.length} questions without underlines. Attempt to auto-underline options A-D in the question text?`)) return;

    setSyncingBulk(true);
    let successCount = 0;
    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    for (const q of toFix) {
      try {
        let newText = q.questionText || '';
        let anyReplaced = false;

        q.questionData.options.forEach((opt: any) => {
          if (opt.text && opt.text.trim()) {
            const regex = new RegExp(`\\b${escapeRegExp(opt.text.trim())}\\b`, 'i');
            if (regex.test(newText)) {
              newText = newText.replace(regex, `<u>${opt.text.trim()}</u>`);
              anyReplaced = true;
            }
          }
        });

        if (anyReplaced) {
          const response = await api.put(`/admin/tests/${testId}/sections/${sectionId}/questions/${q.id}`, { ...q, questionText: newText });
          const updated = response.data.data || response.data;
          setQuestions((prev) => prev.map((item) => item.id === q.id ? updated : item));
          successCount++;
        }
      } catch (err) {
        console.error(`Failed to sync Q${q.questionNumber}:`, err);
      }
    }

    setSyncingBulk(false);
    alert(`Successfully synced ${successCount} questions!`);
  };

  const handleAIGenerateQuestions = async () => {
    if (!section?.passageText) {
      alert('Please add a passage text first before generating questions.');
      return;
    }
    if (!window.confirm('This will generate 10 questions based on the passage text using AI. Continue?')) return;
    
    setGeneratingQuestions(true);
    try {
      const res = await api.post(`/admin/sections/${sectionId}/ai-generate-questions`);
      const data = res.data.data || res.data;
      const newQuestions = Array.isArray(data) ? data : (data.questions || []);
      
      setQuestions((prev) => [...prev, ...newQuestions].sort((a: Question, b: Question) => a.questionNumber - b.questionNumber));
      alert(`Successfully generated ${newQuestions.length} questions!`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to generate questions');
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const getQuestionPreview = (question: Question) => question.questionText?.slice(0, 140) || 'Untitled question';
  const getQuestionTypeColor = (_type: string) => 'default';

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-10 w-80" /><Skeleton className="h-64 w-full" /><Skeleton className="h-96 w-full" /></div>;
  }

  if (error || !test || !section) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || 'Section not found'}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link href={`/admin/tests/${testId}`} className="text-sm text-gray-500 hover:text-gray-700">Back to Test</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{section.title || 'Section Questions'}</h1>
          <p className="text-sm text-gray-500 mt-1">{sectionTypeLabel(section.sectionType)} authoring for TOEFL ITP.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default">{sectionTypeLabel(section.sectionType)}</Badge>
          <Button
            variant="outline"
            onClick={handleBulkGenerateAI}
            loading={generatingBulk}
            className="text-purple-600 border-purple-200 hover:bg-purple-50"
            title="Generate AI explanations for all missing items"
          >
            {!generatingBulk && <Sparkles className="w-4 h-4 mr-1" />}
            AI Auto-Explain
          </Button>
          {section.sectionType === 'reading' && (
            <Button
              variant="outline"
              onClick={handleAIGenerateQuestions}
              loading={generatingQuestions}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
              title="Generate 10 questions using AI"
            >
              {!generatingQuestions && <Sparkles className="w-4 h-4 mr-1" />}
              AI Generate (Beta)
            </Button>
          )}
          {section.sectionType === 'structure' && (
            <Button
              variant="outline"
              onClick={handleBulkSyncUnderlines}
              loading={syncingBulk}
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
              title="Automatically underline options A-D in Written Expression texts (Q16+)"
            >
              {!syncingBulk && <Sparkles className="w-4 h-4 mr-1" />}
              Bulk Sync Written Exp. (Q16+)
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowBulkImporter(true)}>Bulk Import</Button>
          <Button onClick={() => { setEditingQuestion(null); setShowQuestionEditor(true); }}>Add Question</Button>
        </div>
      </div>

      <Card>
        <div className={`grid gap-3 ${section.sectionType === 'listening' ? 'sm:grid-cols-5' : 'sm:grid-cols-4'} text-sm`}>
          <div><p className="text-gray-500">Section</p><p className="font-semibold text-gray-900">{sectionTypeLabel(section.sectionType)}</p></div>
          <div><p className="text-gray-500">Part</p><p className="font-semibold text-gray-900">{section.partNumber || '-'}</p></div>
          <div><p className="text-gray-500">Duration</p><p className="font-semibold text-gray-900">{section.durationMinutes} min</p></div>
          <div><p className="text-gray-500">Questions</p><p className="font-semibold text-gray-900">{questions.length}</p></div>
          {section.sectionType === 'listening' && (
            <div>
              <p className="text-gray-500">Audio</p>
              <div className="font-semibold">
                {section.partNumber === 1 ? (
                  <span className={questions.every(q => q.audioUrl) ? 'text-green-600' : 'text-red-600'}>
                    {questions.filter(q => q.audioUrl).length}/{questions.length} Ready
                  </span>
                ) : (
                  section.audioUrl ? (
                    <span className="text-green-600 flex items-center gap-1"><Volume2 className="w-4 h-4" /> Present</span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1"><VolumeX className="w-4 h-4" /> Missing</span>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {questions.length === 0 ? (
        <Card><div className="text-center py-12"><p className="text-gray-500 mb-4">No questions in this section yet.</p><Button onClick={() => { setEditingQuestion(null); setShowQuestionEditor(true); }}>Add First Question</Button></div></Card>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 mb-2">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="selectAll"
                checked={questions.length > 0 && selectedQuestionIds.length === questions.length}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="selectAll" className="text-sm font-medium text-gray-700 cursor-pointer">
                Select All ({selectedQuestionIds.length}/{questions.length})
              </label>
            </div>
            {selectedQuestionIds.length > 0 && (
              <Button variant="danger" size="sm" onClick={handleBulkDelete} loading={deletingBulk}>
                Delete Selected
              </Button>
            )}
          </div>
          {questions.map((question) => (
            <Card key={question.id} className={selectedQuestionIds.includes(question.id) ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="pt-1.5 flex-shrink-0">
                    <input 
                      type="checkbox" 
                      checked={selectedQuestionIds.includes(question.id)}
                      onChange={(e) => handleSelectQuestion(question.id, e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">{question.questionNumber}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getQuestionTypeColor(question.questionType) as any}>{questionTypeLabel(question.questionType)}</Badge>
                      <span className="text-xs text-gray-400">{question.points} pt{question.points !== 1 ? 's' : ''}</span>
                      {section.sectionType === 'listening' && section.partNumber === 1 && (
                        question.audioUrl ? (
                          <span className="inline-flex items-center text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100 ml-1">
                            <Volume2 className="w-3 h-3 mr-1" /> Audio
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 ml-1">
                            <VolumeX className="w-3 h-3 mr-1" /> Missing Audio
                          </span>
                        )
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{getQuestionPreview(question)}</p>
                    {question.correctAnswer !== undefined && question.correctAnswer !== null && <p className="text-xs text-green-600 mt-1">Answer: {typeof question.correctAnswer === 'object' ? JSON.stringify(question.correctAnswer) : String(question.correctAnswer)}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleGenerateAIExplanation(question.id)}
                    loading={generatingId === question.id}
                    title="Generate AI Explanation"
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  >
                    {!generatingId && <Sparkles className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setEditingQuestion(question); setShowQuestionEditor(true); }}>Edit</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleQuestionDelete(question.id)} loading={deletingQuestionId === question.id} className="text-red-600 hover:text-red-800 hover:bg-red-50">Delete</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showQuestionEditor} onClose={() => { setShowQuestionEditor(false); setEditingQuestion(null); }} title={editingQuestion?.id ? `Edit Question ${editingQuestion.questionNumber}` : 'Add New Question'} size="lg">
        <QuestionEditor testType={test.testType} sectionType={section.sectionType} partNumber={section.partNumber ?? undefined} initialData={editingQuestion?.id ? { id: editingQuestion.id, questionNumber: editingQuestion.questionNumber, questionType: editingQuestion.questionType, questionText: editingQuestion.questionText, audioUrl: editingQuestion.audioUrl || null, questionData: editingQuestion.questionData, correctAnswer: editingQuestion.correctAnswer, points: editingQuestion.points, explanation: editingQuestion.explanation || null, explanationAi: editingQuestion.explanationAi || null } : undefined} nextQuestionNumber={nextQuestionNumber} onSubmit={handleQuestionSubmit} onCancel={() => { setShowQuestionEditor(false); setEditingQuestion(null); }} />
      </Modal>

      <Modal isOpen={showBulkImporter} onClose={() => setShowBulkImporter(false)} title="Bulk Import Questions (TOEFL ITP)" size="lg">
        <BulkQuestionImporter startingQuestionNumber={nextQuestionNumber} onSubmit={handleBulkImport} onCancel={() => setShowBulkImporter(false)} />
      </Modal>
    </div>
  );
}
