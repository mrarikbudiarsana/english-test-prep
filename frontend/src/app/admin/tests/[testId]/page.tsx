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
import { Textarea } from '@/components/ui/Textarea';
import TestForm from '@/components/admin/TestForm';
import SectionEditor from '@/components/admin/SectionEditor';
import { formatLastValidatedAgo } from '@/lib/ptePreviewTime';
import { sectionTypeLabel } from '@/lib/utils';
import type { Test, Section, SectionType } from '@/types/test';

type PteBlueprintPreview = {
  valid: boolean;
  errors: string[];
  readingCounts: Record<string, number>;
  listeningCounts: Record<string, number>;
  readingRules: Record<string, { min: number; max: number }>;
  listeningRules: Record<string, { min: number; max: number }>;
};

export default function AdminEditTestPage() {
  const params = useParams();
  const testId = params.testId as string;

  const [test, setTest] = useState<Test | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [blueprintText, setBlueprintText] = useState('');
  const [blueprintSaving, setBlueprintSaving] = useState(false);
  const [blueprintValidating, setBlueprintValidating] = useState(false);
  const [blueprintError, setBlueprintError] = useState<string | null>(null);
  const [blueprintValidation, setBlueprintValidation] = useState<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);
  const [pteBlueprintPreview, setPteBlueprintPreview] = useState<PteBlueprintPreview | null>(null);
  const [pteBlueprintLoading, setPteBlueprintLoading] = useState(false);
  const [ptePreviewValidatedAt, setPtePreviewValidatedAt] = useState<number | null>(null);
  const [ptePreviewFetchFailed, setPtePreviewFetchFailed] = useState(false);
  const [nowTs, setNowTs] = useState(Date.now());

  // Section editor state
  const [showSectionEditor, setShowSectionEditor] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [deletingSectionId, setDeletingSectionId] = useState<string | null>(null);

  const loadPteBlueprintPreview = useCallback(async (): Promise<PteBlueprintPreview> => {
    setPteBlueprintLoading(true);
    try {
      const previewRes = await api.get(`/admin/tests/${testId}/pte-blueprint/validate`);
      const previewData = previewRes.data.data || previewRes.data;
      const normalizedPreview = previewData as PteBlueprintPreview;
      setPteBlueprintPreview(normalizedPreview);
      setPtePreviewFetchFailed(false);
      setPtePreviewValidatedAt(Date.now());
      setPublishError(null);
      return normalizedPreview;
    } catch {
      const fallbackPreview: PteBlueprintPreview = {
        valid: false,
        errors: ['Failed to load question distribution for PTE blueprint preview.'],
        readingCounts: {},
        listeningCounts: {},
        readingRules: {},
        listeningRules: {},
      };
      setPteBlueprintPreview(fallbackPreview);
      setPtePreviewFetchFailed(true);
      setPtePreviewValidatedAt(Date.now());
      return fallbackPreview;
    } finally {
      setPteBlueprintLoading(false);
    }
  }, [testId]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [testRes, sectionsRes] = await Promise.all([
        api.get(`/admin/tests/${testId}`),
        api.get(`/tests/${testId}/sections`),
      ]);
      const fetchedTest = testRes.data.data || testRes.data;
      setTest(fetchedTest);
      if (fetchedTest?.deliveryModel === 'toefl_ibt_2026') {
        const formatted = JSON.stringify(fetchedTest.blueprintJson || {}, null, 2);
        setBlueprintText(formatted);
      } else {
        setBlueprintText('');
      }
      setBlueprintValidation(null);
      setBlueprintError(null);
      const fetchedSections = sectionsRes.data.data || sectionsRes.data;
      setSections(
        Array.isArray(fetchedSections)
          ? fetchedSections.sort((a: Section, b: Section) => a.sectionOrder - b.sectionOrder)
          : []
      );
      if (fetchedTest?.testType === 'pte_academic') {
        await loadPteBlueprintPreview();
      } else {
        setPteBlueprintPreview(null);
        setPtePreviewValidatedAt(null);
        setPtePreviewFetchFailed(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load test');
    } finally {
      setLoading(false);
    }
  }, [loadPteBlueprintPreview, testId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (test?.testType !== 'pte_academic') return;

    let lastRefreshAt = 0;
    const refreshIfNeeded = () => {
      const now = Date.now();
      if (now - lastRefreshAt < 1500) return;
      lastRefreshAt = now;
      void loadPteBlueprintPreview();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshIfNeeded();
      }
    };

    const onWindowFocus = () => {
      refreshIfNeeded();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onWindowFocus);
    };
  }, [loadPteBlueprintPreview, test?.testType]);

  useEffect(() => {
    if (test?.testType !== 'pte_academic') return;
    const timer = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [test?.testType]);

  const lastValidatedText = formatLastValidatedAgo(ptePreviewValidatedAt, nowTs);

  const handleTestUpdate = async (data: {
    title: string;
    description: string;
    testType: string;
    isFree: boolean;
  }) => {
    setSaving(true);
    try {
      const response = await api.put(`/admin/tests/${testId}`, data);
      setTest(response.data.data || response.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update test');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!test) return;
    setPublishLoading(true);
    setPublishError(null);
    try {
      if (!test.isPublished && test.testType === 'pte_academic') {
        const latestPreview = await loadPteBlueprintPreview();
        if (!latestPreview.valid) {
          const firstErrors = latestPreview.errors.slice(0, 3).join('\n- ');
          setPublishError(`Cannot publish. Fix PTE blueprint issues first:\n- ${firstErrors}`);
          return;
        }
      }
      if (!test.isPublished && test.deliveryModel === 'toefl_ibt_2026') {
        const validateRes = await api.get(`/admin/tests/${testId}/blueprint/validate`);
        const validateData = validateRes.data.data || validateRes.data;
        setBlueprintValidation(validateData);
        if (!validateData.valid) {
          const firstErrors = (validateData.errors || []).slice(0, 3).join('\n- ');
          setPublishError(`Cannot publish. Fix blueprint issues first:\n- ${firstErrors}`);
          return;
        }
      }
      const response = await api.post(`/admin/tests/${testId}/publish`);
      setTest(response.data.data || response.data);
    } catch (err: any) {
      setPublishError(err.response?.data?.error || 'Failed to update publish status');
    } finally {
      setPublishLoading(false);
    }
  };

  const handleBlueprintSave = async () => {
    if (!test || test.deliveryModel !== 'toefl_ibt_2026') return;

    setBlueprintError(null);
    setBlueprintSaving(true);
    try {
      let parsed: any = {};
      try {
        parsed = JSON.parse(blueprintText || '{}');
      } catch {
        setBlueprintError('Blueprint JSON is invalid.');
        return;
      }

      const response = await api.post(`/admin/tests/${testId}/blueprint`, {
        blueprint: parsed,
      });
      const updated = response.data.data || response.data;
      setTest(updated);
      setBlueprintText(JSON.stringify(updated.blueprintJson || parsed, null, 2));
      setBlueprintError(null);
      alert('Blueprint saved.');
    } catch (err: any) {
      setBlueprintError(err.response?.data?.error || 'Failed to save blueprint.');
    } finally {
      setBlueprintSaving(false);
    }
  };

  const handleBlueprintValidate = async () => {
    if (!test || test.deliveryModel !== 'toefl_ibt_2026') return;

    setBlueprintError(null);
    setBlueprintValidating(true);
    try {
      let parsed: any = {};
      try {
        parsed = JSON.parse(blueprintText || '{}');
      } catch {
        setBlueprintError('Blueprint JSON is invalid.');
        return;
      }

      // Save draft before validation so backend validates current blueprint version.
      await api.post(`/admin/tests/${testId}/blueprint`, { blueprint: parsed });

      const response = await api.get(`/admin/tests/${testId}/blueprint/validate`);
      const result = response.data.data || response.data;
      setBlueprintValidation(result);
    } catch (err: any) {
      setBlueprintError(err.response?.data?.error || 'Failed to validate blueprint.');
    } finally {
      setBlueprintValidating(false);
    }
  };

  const handleSectionSubmit = async (sectionData: any) => {
    try {
      if (editingSection) {
        const response = await api.put(
          `/admin/sections/${editingSection.id}`,
          sectionData
        );
        const updated = response.data.data || response.data;
        setSections((prev) =>
          prev
            .map((s) => (s.id === editingSection.id ? updated : s))
            .sort((a, b) => a.sectionOrder - b.sectionOrder)
        );
      } else {
        const response = await api.post(`/admin/tests/${testId}/sections`, sectionData);
        const created = response.data.data || response.data;
        setSections((prev) => [...prev, created].sort((a, b) => a.sectionOrder - b.sectionOrder));
      }
      setShowSectionEditor(false);
      setEditingSection(null);
      setPublishError(null);
      if (test?.testType === 'pte_academic') {
        await loadPteBlueprintPreview();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save section');
      throw err; // re-throw so SectionEditor can handle loading state
    }
  };

  const handleSectionDelete = async (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (
      !window.confirm(
        `Are you sure you want to delete "${section?.title || 'this section'}"? All questions in this section will also be deleted.`
      )
    ) {
      return;
    }
    setDeletingSectionId(sectionId);
    try {
      await api.delete(`/admin/sections/${sectionId}`);
      setSections((prev) => prev.filter((s) => s.id !== sectionId));
      setPublishError(null);
      if (test?.testType === 'pte_academic') {
        await loadPteBlueprintPreview();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete section');
    } finally {
      setDeletingSectionId(null);
    }
  };

  const openEditSection = (section: Section) => {
    setEditingSection(section);
    setShowSectionEditor(true);
  };

  const openNewSection = () => {
    setEditingSection(null);
    setShowSectionEditor(true);
  };

  const getSectionTypeColor = (type: SectionType): string => {
    const colors: Record<SectionType, string> = {
      listening: 'bg-purple-100 text-purple-800 border-purple-200',
      reading: 'bg-green-100 text-green-800 border-green-200',
      writing: 'bg-amber-100 text-amber-800 border-amber-200',
      speaking: 'bg-blue-100 text-blue-800 border-blue-200',
      structure: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="text" width="40%" height={32} />
        <Card>
          <div className="space-y-4">
            <Skeleton variant="rect" height={40} />
            <Skeleton variant="rect" height={80} />
            <Skeleton variant="rect" height={40} />
          </div>
        </Card>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="space-y-6">
        <Link href="/admin/tests" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          &larr; Back to Tests
        </Link>
        <Card>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error || 'Test not found'}</p>
            <button onClick={fetchData} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Try again
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/tests"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Test</h1>
          <Badge variant={test.isPublished ? 'success' : 'default'}>
            {test.isPublished ? 'Published' : 'Draft'}
          </Badge>
          {test.deliveryModel === 'toefl_ibt_2026' && (
            <Badge variant="default" className="bg-cyan-100 text-cyan-800 border-cyan-200">
              2026 Adaptive Model
            </Badge>
          )}
        </div>
        <Button
          variant={test.isPublished ? 'outline' : 'primary'}
          onClick={handlePublishToggle}
          loading={publishLoading}
        >
          {test.isPublished ? 'Unpublish' : 'Publish'}
        </Button>
      </div>

      {publishError ? (
        <Card>
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 whitespace-pre-line">
            {publishError}
          </div>
        </Card>
      ) : null}

      {/* Test Details Form */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Details</h2>
        <TestForm
          initialData={{
            title: test.title,
            description: test.description || '',
            testType: test.testType,
            isFree: test.isFree,
          }}
          onSubmit={handleTestUpdate}
          loading={saving}
        />
      </Card>

      {test.testType === 'pte_academic' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">PTE Blueprint Preview</h2>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={loadPteBlueprintPreview}
                loading={pteBlueprintLoading}
              >
                Revalidate Preview
              </Button>
              {pteBlueprintLoading ? (
                <span className="text-xs text-gray-500">Loading...</span>
              ) : pteBlueprintPreview ? (
                <Badge variant={pteBlueprintPreview.valid ? 'success' : 'default'} className={pteBlueprintPreview.valid ? '' : 'bg-amber-100 text-amber-800 border-amber-200'}>
                  {pteBlueprintPreview.valid ? 'Valid' : 'Needs Fixes'}
                </Badge>
              ) : null}
              {!pteBlueprintLoading && lastValidatedText ? (
                <span className="text-xs text-gray-500">{lastValidatedText}</span>
              ) : null}
            </div>
          </div>

          {ptePreviewFetchFailed ? (
            <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
              Couldn&apos;t refresh latest blueprint preview. Click Revalidate Preview to retry.
            </div>
          ) : null}

          {pteBlueprintPreview?.errors?.length ? (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3">
              <h3 className="text-sm font-semibold text-amber-800 mb-2">Issues</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-amber-700">
                {pteBlueprintPreview.errors.map((msg, idx) => (
                  <li key={`pte-blueprint-err-${idx}`}>{msg}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Reading Distribution</h3>
              <div className="space-y-1 text-sm">
                {Object.entries(pteBlueprintPreview?.readingRules || {}).map(([type, rule]) => {
                  const count = pteBlueprintPreview?.readingCounts?.[type] || 0;
                  const ok = count >= rule.min && count <= rule.max;
                  return (
                    <div key={`read-${type}`} className="flex items-center justify-between">
                      <span className="text-gray-700">{type}</span>
                      <span className={ok ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
                        {count} (target {rule.min}-{rule.max})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Listening Distribution</h3>
              <div className="space-y-1 text-sm">
                {Object.entries(pteBlueprintPreview?.listeningRules || {}).map(([type, rule]) => {
                  const count = pteBlueprintPreview?.listeningCounts?.[type] || 0;
                  const ok = count >= rule.min && count <= rule.max;
                  return (
                    <div key={`list-${type}`} className="flex items-center justify-between">
                      <span className="text-gray-700">{type}</span>
                      <span className={ok ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
                        {count} (target {rule.min}-{rule.max})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      )}

      {test.deliveryModel === 'toefl_ibt_2026' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">TOEFL iBT Blueprint</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleBlueprintValidate}
                loading={blueprintValidating}
              >
                Validate Blueprint
              </Button>
              <Button onClick={handleBlueprintSave} loading={blueprintSaving}>
                Save Blueprint
              </Button>
            </div>
          </div>

          <Textarea
            value={blueprintText}
            onChange={(e) => setBlueprintText(e.target.value)}
            rows={18}
            className="font-mono text-xs"
            placeholder="{}"
          />

          {blueprintError && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {blueprintError}
            </div>
          )}

          {blueprintValidation && (
            <div className="mt-4 space-y-3">
              <div
                className={`rounded-md border p-3 text-sm ${
                  blueprintValidation.valid
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-amber-200 bg-amber-50 text-amber-800'
                }`}
              >
                {blueprintValidation.valid
                  ? 'Validation passed. Blueprint and authored structure are publish-ready.'
                  : 'Validation failed. Fix errors below before publishing.'}
              </div>

              {blueprintValidation.errors.length > 0 && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3">
                  <h3 className="text-sm font-semibold text-red-800 mb-2">Errors</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-red-700">
                    {blueprintValidation.errors.map((msg, idx) => (
                      <li key={`blueprint-error-${idx}`}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}

              {blueprintValidation.warnings.length > 0 && (
                <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
                  <h3 className="text-sm font-semibold text-yellow-800 mb-2">Warnings</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-yellow-700">
                    {blueprintValidation.warnings.map((msg, idx) => (
                      <li key={`blueprint-warning-${idx}`}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Sections */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Sections ({sections.length})
          </h2>
          <Button size="sm" onClick={openNewSection}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Section
          </Button>
        </div>

        {sections.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <svg className="mx-auto h-10 w-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <p className="text-sm text-gray-500 mb-3">No sections yet. Add sections to build your test.</p>
            <Button size="sm" onClick={openNewSection}>
              Add First Section
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sections.map((section) => (
              <div
                key={section.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                    {section.sectionOrder}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {section.title || `Section ${section.sectionOrder}`}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getSectionTypeColor(section.sectionType)}`}
                      >
                        {sectionTypeLabel(section.sectionType)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {section.durationMinutes} min
                      {section.sectionType === 'listening' && section.audioUrl && ' | Audio attached'}
                      {['listening', 'speaking', 'structure'].includes(section.sectionType) && section.partNumber && ` | Part ${section.partNumber}`}
                      {section.sectionType === 'reading' && section.passageTitle && ` | ${section.passageTitle}`}
                      {section.sectionType === 'writing' && section.taskNumber && ` | Task ${section.taskNumber}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href={`/admin/tests/${testId}/sections/${section.id}`}>
                    <Button variant="ghost" size="sm">
                      Questions
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => openEditSection(section)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSectionDelete(section.id)}
                    loading={deletingSectionId === section.id}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Section Editor Modal */}
      <Modal
        isOpen={showSectionEditor}
        onClose={() => {
          setShowSectionEditor(false);
          setEditingSection(null);
        }}
        title={editingSection ? 'Edit Section' : 'Add New Section'}
        size="lg"
      >
        <SectionEditor
          testType={test.testType}
          existingSections={sections}
          initialData={editingSection || undefined}
          onSubmit={handleSectionSubmit}
          onCancel={() => {
            setShowSectionEditor(false);
            setEditingSection(null);
          }}
        />
      </Modal>
    </div>
  );
}
