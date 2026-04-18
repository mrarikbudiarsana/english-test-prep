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
import type { Test, Section } from '@/types/test';

export default function AdminEditTestPage() {
  const params = useParams();
  const testId = params.testId as string;

  const [test, setTest] = useState<Test | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
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
      setSections(Array.isArray(fetchedSections) ? fetchedSections.sort((a: Section, b: Section) => a.sectionOrder - b.sectionOrder) : []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load test');
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTestUpdate = async (data: { title: string; description: string; testType: string; isFree: boolean; durationMinutes: number; }) => {
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
      const response = test.isPublished ? await api.delete(`/admin/tests/${testId}/publish`) : await api.post(`/admin/tests/${testId}/publish`);
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
        const response = await api.put(`/admin/tests/${testId}/sections/${editingSection.id}`, sectionData);
        const updated = response.data.data || response.data;
        setSections((prev) => prev.map((section) => section.id === editingSection.id ? updated : section).sort((a, b) => a.sectionOrder - b.sectionOrder));
      } else {
        const response = await api.post(`/admin/tests/${testId}/sections`, sectionData);
        const created = response.data.data || response.data;
        setSections((prev) => [...prev, created].sort((a, b) => a.sectionOrder - b.sectionOrder));
      }
      setShowSectionEditor(false);
      setEditingSection(null);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save section');
      throw err;
    }
  };

  const handleSectionDelete = async (sectionId: string) => {
    if (!window.confirm('Delete this section? This cannot be undone.')) return;
    setDeletingSectionId(sectionId);
    try {
      await api.delete(`/admin/tests/${testId}/sections/${sectionId}`);
      setSections((prev) => prev.filter((section) => section.id !== sectionId));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete section');
    } finally {
      setDeletingSectionId(null);
    }
  };

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-10 w-72" /><Skeleton className="h-64 w-full" /><Skeleton className="h-96 w-full" /></div>;
  }

  if (error || !test) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || 'Test not found'}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link href="/admin/tests" className="text-sm text-gray-500 hover:text-gray-700">Back to Tests</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Edit TOEFL ITP Test</h1>
          <p className="text-sm text-gray-500 mt-1">Manage the test shell, publish state, and TOEFL ITP sections.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={test.isPublished ? 'success' : 'default'}>{test.isPublished ? 'Published' : 'Draft'}</Badge>
          <Button onClick={handlePublishToggle} loading={publishLoading}>{test.isPublished ? 'Unpublish' : 'Publish'}</Button>
        </div>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Settings</h2>
        <TestForm
          initialData={{
            title: test.title,
            description: test.description || '',
            testType: test.testType,
            isFree: test.isFree,
            durationMinutes: test.durationMinutes,
          }}
          onSubmit={handleTestUpdate}
          loading={saving}
        />
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Sections ({sections.length})</h2>
          <Button size="sm" onClick={() => { setEditingSection(null); setShowSectionEditor(true); }}>Add Section</Button>
        </div>

        {sections.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-sm text-gray-500 mb-3">No sections yet. Add Listening, Structure, and Reading sections to build this test.</p>
            <Button size="sm" onClick={() => { setEditingSection(null); setShowSectionEditor(true); }}>Add First Section</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sections.map((section) => (
              <div key={section.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">{section.sectionOrder}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><span className="text-sm font-medium text-gray-900 truncate">{section.title || `Section ${section.sectionOrder}`}</span><span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium border-violet-200 bg-violet-50 text-violet-700">{sectionTypeLabel(section.sectionType)}</span></div>
                    <p className="text-xs text-gray-500 mt-0.5">{section.durationMinutes} min{section.partNumber ? ` | Part ${section.partNumber}` : ''}{section.sectionType === 'reading' && section.passageTitle ? ` | ${section.passageTitle}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href={`/admin/tests/${testId}/sections/${section.id}`}><Button variant="ghost" size="sm">Questions</Button></Link>
                  <Button variant="ghost" size="sm" onClick={() => { setEditingSection(section); setShowSectionEditor(true); }}>Edit</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleSectionDelete(section.id)} loading={deletingSectionId === section.id} className="text-red-600 hover:text-red-800 hover:bg-red-50">Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal isOpen={showSectionEditor} onClose={() => { setShowSectionEditor(false); setEditingSection(null); }} title={editingSection ? 'Edit Section' : 'Add New Section'} size="lg">
        <SectionEditor testType={test.testType} existingSections={sections} initialData={editingSection || undefined} onSubmit={handleSectionSubmit} onCancel={() => { setShowSectionEditor(false); setEditingSection(null); }} />
      </Modal>
    </div>
  );
}
