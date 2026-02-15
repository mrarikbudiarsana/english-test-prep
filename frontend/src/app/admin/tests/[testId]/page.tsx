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
import TestForm from '@/components/admin/TestForm';
import SectionEditor from '@/components/admin/SectionEditor';
import { sectionTypeLabel } from '@/lib/utils';
import type { Test, Section, SectionType } from '@/types/test';

export default function AdminEditTestPage() {
  const params = useParams();
  const testId = params.testId as string;

  const [test, setTest] = useState<Test | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);

  // Section editor state
  const [showSectionEditor, setShowSectionEditor] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [deletingSectionId, setDeletingSectionId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [testRes, sectionsRes] = await Promise.all([
        api.get(`/admin/tests/${testId}`),
        api.get(`/tests/${testId}/sections`),
      ]);
      setTest(testRes.data.data || testRes.data);
      const fetchedSections = sectionsRes.data.data || sectionsRes.data;
      setSections(
        Array.isArray(fetchedSections)
          ? fetchedSections.sort((a: Section, b: Section) => a.sectionOrder - b.sectionOrder)
          : []
      );
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load test');
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    try {
      const response = await api.post(`/admin/tests/${testId}/publish`);
      setTest(response.data.data || response.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update publish status');
    } finally {
      setPublishLoading(false);
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
        </div>
        <Button
          variant={test.isPublished ? 'outline' : 'primary'}
          onClick={handlePublishToggle}
          loading={publishLoading}
        >
          {test.isPublished ? 'Unpublish' : 'Publish'}
        </Button>
      </div>

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
