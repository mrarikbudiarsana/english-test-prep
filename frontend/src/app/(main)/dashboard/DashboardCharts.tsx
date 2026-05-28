'use client';
import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, Cell, LabelList,
} from 'recharts';
import { HiLockClosed } from 'react-icons/hi';
import { ExamType } from '@/types/user';
import { getExamConfig } from '@/config/examConfig';
import { formatScore } from '@/lib/utils';

interface DashboardChartsProps {
  recentAttempts: any[];
  sectionAverages: Record<string, number | null>;
  examType?: ExamType;
  tier?: string;
}

function getSectionScaledScore(attempt: any): number | null {
  if (attempt.practiceSectionType === 'listening') return attempt.listeningScore ?? null;
  if (attempt.practiceSectionType === 'reading') return attempt.readingScore ?? null;
  if (attempt.practiceSectionType === 'structure') return attempt.structureScore ?? null;
  return null;
}

function getAttemptScore(attempt: any): number | null {
  return attempt.mode === 'section_practice'
    ? getSectionScaledScore(attempt)
    : attempt.overallScore ?? null;
}

export function DashboardCharts({ recentAttempts, sectionAverages, examType = 'toefl_itp', tier = 'free' }: DashboardChartsProps) {
  const examConfig = getExamConfig(examType);
  const { scoreRange, scoreLabel, sections: examSections, theme } = examConfig;
  const chartColor = theme.chartColor;
  const [chartMode, setChartMode] = useState<'full' | 'section_practice'>('full');
  const progressionRange = chartMode === 'section_practice' ? examConfig.sectionScoreRange : scoreRange;
  const progressionLabel = chartMode === 'section_practice' ? 'Section Scaled Score' : scoreLabel;

  const filteredAttempts = recentAttempts.filter(a => chartMode === 'full' ? (a.mode === 'full' || !a.mode) : a.mode === 'section_practice');

  const progressData = [...filteredAttempts].reverse().slice(-10).map((attempt, index) => ({
    name: `Test ${index + 1}`,
    score: getAttemptScore(attempt) ?? 0,
    date: new Date(attempt.completedAt).toLocaleDateString(),
    title: attempt.testTitle,
  }));

  const skillsData = examSections.map((section) => ({ subject: section.label, score: sectionAverages[section.key] || 0, fullMark: examConfig.sectionScoreRange.max }));
  const scoredSections = skillsData.filter((section) => section.score > 0);
  const useRadar = tier === 'pro' && scoredSections.length >= 3;

  const formatScoreValue = (val: number | string | undefined) => typeof val === 'number' ? formatScore(val, examConfig.scorePrecision) : val || '-';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Score Progression</h3>
            <p className="text-sm text-slate-500">Track your improvement over time</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setChartMode('full')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${chartMode === 'full' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Full
            </button>
            <button
              onClick={() => setChartMode('section_practice')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${chartMode === 'section_practice' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Sections
            </button>
          </div>
        </div>
        <div className="h-[300px] w-full">
          {tier === 'free' ? (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-slate-100 p-8 text-center"><div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3"><HiLockClosed className="w-5 h-5 text-gray-400" /></div><h4 className="font-semibold text-gray-700 mb-1">Score History Locked</h4><p className="text-sm text-gray-500 max-w-xs">Upgrade to Starter to track your progress over time and identify trends.</p></div>
          ) : progressData.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}><LineChart data={progressData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}><defs><linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={chartColor} /><stop offset="100%" stopColor={chartColor} /></linearGradient><linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={chartColor} stopOpacity={0.15} /><stop offset="95%" stopColor={chartColor} stopOpacity={0.01} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} /><YAxis domain={[progressionRange.min, progressionRange.max]} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} /><Tooltip formatter={(value: number | undefined) => [formatScoreValue(value), progressionLabel]} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'white', padding: '12px' }} labelStyle={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }} cursor={{ stroke: `${chartColor}40`, strokeWidth: 2 }} /><Line type="monotone" dataKey="score" stroke={chartColor} strokeWidth={3} dot={{ r: 5, strokeWidth: 3, fill: '#fff', stroke: chartColor }} activeDot={{ r: 7, strokeWidth: 0, fill: chartColor }} animationDuration={1500} /></LineChart></ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400"><div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4"><svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg></div><p className="font-semibold text-slate-600 mb-1">Not enough data</p><p className="text-sm text-slate-500">Complete at least 2 tests to see your progress</p></div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="mb-6"><h3 className="text-lg font-bold text-slate-800 mb-1">Skills Breakdown</h3><p className="text-sm text-slate-500">Performance by test section</p></div>
        <div className="h-[300px] w-full overflow-y-auto">
          {tier === 'free' ? (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-slate-100 p-8 text-center"><div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3"><HiLockClosed className="w-5 h-5 text-gray-400" /></div><h4 className="font-semibold text-gray-700 mb-1">Skills Analysis Locked</h4><p className="text-sm text-gray-500 max-w-xs">Upgrade to Starter to see your detailed skill breakdown.</p></div>
          ) : scoredSections.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400"><div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4"><svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg></div><p className="font-semibold text-slate-600 mb-1 text-center">No data yet</p><p className="text-sm text-slate-500 text-center">Take tests to see your skills analysis</p></div>
          ) : useRadar ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}><RadarChart cx="50%" cy="50%" outerRadius="50%" data={skillsData}><defs><linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={chartColor} /><stop offset="100%" stopColor={theme.primaryDark} /></linearGradient></defs><PolarGrid stroke="#e2e8f0" strokeWidth={1.5} /><PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} /><PolarRadiusAxis angle={30} domain={[examConfig.sectionScoreRange.min, examConfig.sectionScoreRange.max]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} /><Radar name={scoreLabel} dataKey="score" stroke="url(#radarGradient)" strokeWidth={3} fill="url(#radarGradient)" fillOpacity={0.25} /><Tooltip formatter={(value: number | undefined) => [formatScoreValue(value), scoreLabel]} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'white', padding: '12px' }} labelStyle={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }} itemStyle={{ color: '#334155', fontWeight: 500 }} cursor={{ stroke: `${chartColor}40`, strokeWidth: 2 }} /></RadarChart></ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}><BarChart data={scoredSections} layout="vertical" margin={{ top: 8, right: 48, left: 8, bottom: 8 }} barCategoryGap="30%"><CartesianGrid horizontal={false} stroke="#e2e8f0" /><XAxis type="number" domain={[0, examConfig.sectionScoreRange.max]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="subject" tick={{ fill: '#475569', fontSize: 13, fontWeight: 600 }} axisLine={false} tickLine={false} width={64} /><Tooltip formatter={(value: any) => [formatScoreValue(value), scoreLabel]} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'white', padding: '8px 12px' }} labelStyle={{ fontWeight: 600, color: '#1e293b' }} /><Bar dataKey="score" radius={[0, 8, 8, 0]} maxBarSize={40}>{scoredSections.map((_, i) => <Cell key={i} fill={chartColor} fillOpacity={0.85} />)}<LabelList dataKey="score" position="right" formatter={(v: any) => formatScoreValue(v)} style={{ fill: '#475569', fontSize: 13, fontWeight: 700 }} /></Bar></BarChart></ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
