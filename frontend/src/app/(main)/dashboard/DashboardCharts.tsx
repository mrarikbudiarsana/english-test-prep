'use client';
import { useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    BarChart,
    Bar,
    Cell,
    LabelList,
} from 'recharts';
import { ExamType } from '@/types/user';
import { getExamConfig } from '@/config/examConfig';
import { formatScore } from '@/lib/utils';

interface DashboardChartsProps {
    recentAttempts: any[];
    sectionAverages: Record<string, number | null>;
    examType?: ExamType;
}

type SkillsTab = 'sections' | 'writing' | 'speaking';

function CriteriaPanel({ criteria, color, radarId }: {
    criteria: { label: string; short: string; band: number }[];
    color: string;
    radarId: string;
}) {
    const radarData = criteria.map(c => ({ subject: c.short, score: c.band, fullMark: 9 }));
    const barData = criteria.map(c => ({ subject: c.label, score: c.band }));
    return (
        <div className="flex flex-col gap-3 h-full">
            <div className="h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                        <defs>
                            <linearGradient id={radarId} x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor={color} /><stop offset="100%" stopColor={color} />
                            </linearGradient>
                        </defs>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                        <PolarRadiusAxis domain={[0, 9]} tick={false} axisLine={false} />
                        <Radar dataKey="score" stroke={color} strokeWidth={2} fill={color} fillOpacity={0.2} />
                        <Tooltip formatter={(v: any) => [`Band ${v}`, 'Score']} contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 11 }} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
            <div className="flex-1">
                <ResponsiveContainer width="100%" height={criteria.length * 36 + 8}>
                    <BarChart data={barData} layout="vertical" margin={{ top: 2, right: 36, left: 4, bottom: 2 }} barCategoryGap="20%">
                        <XAxis type="number" domain={[0, 9]} hide />
                        <YAxis type="category" dataKey="subject" width={108} tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v: any) => [`Band ${v}`, 'Score']} contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 11 }} />
                        <Bar dataKey="score" radius={[0, 6, 6, 0]} maxBarSize={22}>
                            {barData.map((_, i) => <Cell key={i} fill={color} fillOpacity={0.8} />)}
                            <LabelList dataKey="score" position="right" formatter={(v: any) => `${v}`} style={{ fill: '#475569', fontSize: 12, fontWeight: 700 }} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export function DashboardCharts({ recentAttempts, sectionAverages, examType = 'ielts' }: DashboardChartsProps) {
    const examConfig = getExamConfig(examType);
    const { scoreRange, scoreLabel, sections: examSections, theme } = examConfig;
    const chartColor = theme.chartColor;
    const [skillsTab, setSkillsTab] = useState<SkillsTab>('sections');

    // Prepare data for Progress Chart (reverse recentAttempts to show oldest to newest)
    const progressData = [...recentAttempts].reverse().slice(-10).map((attempt, index) => ({
        name: `Test ${index + 1}`,
        score: attempt.overallBand ?? attempt.overallScore ?? 0,
        date: new Date(attempt.completedAt).toLocaleDateString(),
        title: attempt.testTitle,
    }));

    // Prepare data for Skills Chart based on exam sections
    const skillsData = examSections.map((section) => ({
        subject: section.label,
        score: sectionAverages[section.key] || 0,
        fullMark: examConfig.sectionScoreRange.max,
    }));
    const scoredSections = skillsData.filter(s => s.score > 0);
    const useRadar = scoredSections.length >= 3;

    // Extract most recent writing/speaking criteria from recentAttempts
    const recentWriting = recentAttempts.find(a => a.writingFeedback?.tasks?.length > 0);
    const recentSpeaking = recentAttempts.find(a => a.speakingFeedback?.fluencyCoherence);

    const writingCriteria = recentWriting ? (() => {
        const tasks = recentWriting.writingFeedback.tasks as any[];
        // Average criteria across tasks
        const avg = (key: string) => Math.round(tasks.reduce((s: number, t: any) => s + (t[key]?.band ?? 0), 0) / tasks.length);
        const hasTA = tasks.some((t: any) => t.taskAchievement);
        const hasTR = tasks.some((t: any) => t.taskResponse);
        return [
            ...(hasTA ? [{ label: 'Task Achievement', short: 'TA', band: avg('taskAchievement') }] : []),
            ...(hasTR ? [{ label: 'Task Response', short: 'TR', band: avg('taskResponse') }] : []),
            { label: 'Coherence & Cohesion', short: 'CC', band: avg('coherenceCohesion') },
            { label: 'Lexical Resource', short: 'LR', band: avg('lexicalResource') },
            { label: 'Grammar & Accuracy', short: 'GRA', band: avg('grammaticalRangeAccuracy') },
        ];
    })() : null;

    const speakingCriteria = recentSpeaking ? [
        { label: 'Fluency & Coherence', short: 'FC', band: recentSpeaking.speakingFeedback.fluencyCoherence.band },
        { label: 'Lexical Resource', short: 'LR', band: recentSpeaking.speakingFeedback.lexicalResource.band },
        { label: 'Grammar & Accuracy', short: 'GRA', band: recentSpeaking.speakingFeedback.grammaticalRangeAccuracy.band },
        { label: 'Pronunciation', short: 'Pron', band: recentSpeaking.speakingFeedback.pronunciation.band },
    ] : null;

    const showWritingTab = !!writingCriteria;
    const showSpeakingTab = !!speakingCriteria;

    const formatScoreValue = (val: number | string | undefined) => {
        if (val === undefined || val === null) return '-';
        if (typeof val !== 'number') return val;
        return formatScore(val, examConfig.scorePrecision);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Progress Chart - 2/3 width */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Score Progression</h3>
                    <p className="text-sm text-slate-500">Track your improvement over time</p>
                </div>
                <div className="h-[300px] w-full">
                    {progressData.length > 1 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={progressData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                {/* ... (defs unchanged) ... */}
                                <defs>
                                    <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor={chartColor} />
                                        <stop offset="100%" stopColor={chartColor} />
                                    </linearGradient>
                                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={chartColor} stopOpacity={0.15} />
                                        <stop offset="95%" stopColor={chartColor} stopOpacity={0.01} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                                    axisLine={{ stroke: '#e2e8f0' }}
                                    tickLine={false}
                                />
                                <YAxis
                                    domain={[scoreRange.min, scoreRange.max]}
                                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                                    axisLine={{ stroke: '#e2e8f0' }}
                                    tickLine={false}
                                />
                                <Tooltip
                                    formatter={(value: number | undefined) => [formatScoreValue(value), scoreLabel]}
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                        backgroundColor: 'white',
                                        padding: '12px'
                                    }}
                                    labelStyle={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}
                                    cursor={{ stroke: `${chartColor}40`, strokeWidth: 2 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke={chartColor}
                                    strokeWidth={3}
                                    dot={{ r: 5, strokeWidth: 3, fill: '#fff', stroke: chartColor }}
                                    activeDot={{ r: 7, strokeWidth: 0, fill: chartColor }}
                                    animationDuration={1500}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        // ... (empty state unchanged) ...
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <p className="font-semibold text-slate-600 mb-1">Not enough data</p>
                            <p className="text-sm text-slate-500">Complete at least 2 tests to see your progress</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Skills Breakdown - 1/3 width */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-800 mb-3">Skills Breakdown</h3>
                    {/* Tabs */}
                    {(showWritingTab || showSpeakingTab) && (
                        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 text-xs font-semibold">
                            <button
                                onClick={() => setSkillsTab('sections')}
                                className={`flex-1 py-1.5 rounded-md transition-all ${skillsTab === 'sections' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Sections
                            </button>
                            {showWritingTab && (
                                <button
                                    onClick={() => setSkillsTab('writing')}
                                    className={`flex-1 py-1.5 rounded-md transition-all ${skillsTab === 'writing' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Writing
                                </button>
                            )}
                            {showSpeakingTab && (
                                <button
                                    onClick={() => setSkillsTab('speaking')}
                                    className={`flex-1 py-1.5 rounded-md transition-all ${skillsTab === 'speaking' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Speaking
                                </button>
                            )}
                        </div>
                    )}
                </div>
                <div className="h-[300px] w-full overflow-y-auto">
                    {skillsTab === 'writing' && writingCriteria ? (
                        <CriteriaPanel criteria={writingCriteria} color="#3b82f6" radarId="dashWritingRadar" />
                    ) : skillsTab === 'speaking' && speakingCriteria ? (
                        <CriteriaPanel criteria={speakingCriteria} color="#8b5cf6" radarId="dashSpeakingRadar" />
                    ) : scoredSections.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                            </div>
                            <p className="font-semibold text-slate-600 mb-1 text-center">No data yet</p>
                            <p className="text-sm text-slate-500 text-center">Take tests to see your skills analysis</p>
                        </div>
                    ) : useRadar ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="60%" data={skillsData}>
                                <defs>
                                    <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor={chartColor} />
                                        <stop offset="100%" stopColor={theme.primaryDark} />
                                    </linearGradient>
                                </defs>
                                <PolarGrid stroke="#e2e8f0" strokeWidth={1.5} />
                                <PolarAngleAxis
                                    dataKey="subject"
                                    tick={{ fill: '#475569', fontSize: 13, fontWeight: 600 }}
                                />
                                <PolarRadiusAxis
                                    angle={30}
                                    domain={[examConfig.sectionScoreRange.min, examConfig.sectionScoreRange.max]}
                                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                                    axisLine={false}
                                />
                                <Radar
                                    name={scoreLabel}
                                    dataKey="score"
                                    stroke="url(#radarGradient)"
                                    strokeWidth={3}
                                    fill="url(#radarGradient)"
                                    fillOpacity={0.25}
                                />
                                <Tooltip
                                    formatter={(value: number | undefined) => [formatScoreValue(value), scoreLabel]}
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                        backgroundColor: 'white',
                                        padding: '12px'
                                    }}
                                    labelStyle={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}
                                    itemStyle={{ color: '#334155', fontWeight: 500 }}
                                    cursor={{ stroke: `${chartColor}40`, strokeWidth: 2 }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={scoredSections}
                                layout="vertical"
                                margin={{ top: 8, right: 48, left: 8, bottom: 8 }}
                                barCategoryGap="30%"
                            >
                                <CartesianGrid horizontal={false} stroke="#e2e8f0" />
                                <XAxis
                                    type="number"
                                    domain={[0, examConfig.sectionScoreRange.max]}
                                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="subject"
                                    tick={{ fill: '#475569', fontSize: 13, fontWeight: 600 }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={64}
                                />
                                <Tooltip
                                    formatter={(value: any) => [formatScoreValue(value), scoreLabel]}
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                        backgroundColor: 'white',
                                        padding: '8px 12px'
                                    }}
                                    labelStyle={{ fontWeight: 600, color: '#1e293b' }}
                                />
                                <Bar dataKey="score" radius={[0, 8, 8, 0]} maxBarSize={40}>
                                    {scoredSections.map((_, i) => (
                                        <Cell key={i} fill={chartColor} fillOpacity={0.85} />
                                    ))}
                                    <LabelList
                                        dataKey="score"
                                        position="right"
                                        formatter={(v: any) => formatScoreValue(v)}
                                        style={{ fill: '#475569', fontSize: 13, fontWeight: 700 }}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
}
