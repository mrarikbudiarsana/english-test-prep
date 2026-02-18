'use client';

import type { Section, SpeakingPrompt } from '@/types/test';
import AudioRecorder from '@/components/test/AudioRecorder';

type SpeakingRecord = { url: string; duration: number };

interface ToeflIbtSpeakingRendererProps {
  section: Section;
  activePromptIndex: number;
  recordings: Record<string, SpeakingRecord>;
  onPromptChange: (nextIndex: number) => void;
  onRecordingComplete: (promptIndex: number, record: SpeakingRecord) => void;
}

function parsePrompts(section: Section): SpeakingPrompt[] {
  if (Array.isArray(section.speakingPrompts)) {
    return section.speakingPrompts;
  }

  if (typeof section.speakingPrompts === 'string') {
    try {
      const parsed = JSON.parse(section.speakingPrompts);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [];
    }
  }

  return [];
}

export default function ToeflIbtSpeakingRenderer({
  section,
  activePromptIndex,
  recordings,
  onPromptChange,
  onRecordingComplete,
}: ToeflIbtSpeakingRendererProps) {
  const prompts = parsePrompts(section);
  const promptCount = prompts.length;
  const safeIndex = Math.max(0, Math.min(activePromptIndex, Math.max(0, promptCount - 1)));
  const currentPrompt = prompts[safeIndex];
  const currentRecording = recordings[String(safeIndex)];
  const hasPrompts = promptCount > 0;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
          {(section.taskType || 'speaking_task').replace(/_/g, ' ')}
        </p>
        {(section.title || section.instructions) && (
          <h2 className="text-lg font-semibold text-gray-900">{section.title || 'Speaking Task'}</h2>
        )}
        {section.instructions && (
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{section.instructions}</p>
        )}
      </div>

      {hasPrompts ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-5 text-center space-y-2">
            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Prompt {safeIndex + 1} of {promptCount}
            </p>
            <p className="text-lg font-medium text-gray-900">{currentPrompt?.text}</p>
            {currentPrompt?.followUp && (
              <p className="text-sm text-gray-600">Follow-up: {currentPrompt.followUp}</p>
            )}
          </div>

          {promptCount > 1 && (
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => onPromptChange(Math.max(0, safeIndex - 1))}
                disabled={safeIndex === 0}
                className="text-sm font-medium text-gray-600 hover:text-blue-700 disabled:text-gray-300 disabled:cursor-not-allowed"
              >
                Previous Prompt
              </button>
              <button
                type="button"
                onClick={() => onPromptChange(Math.min(promptCount - 1, safeIndex + 1))}
                disabled={safeIndex >= promptCount - 1}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-300 disabled:cursor-not-allowed"
              >
                Next Prompt
              </button>
            </div>
          )}

          <AudioRecorder
            key={`${section.id}-${safeIndex}`}
            maxDuration={section.responseTime ?? 45}
            onRecordingComplete={(url, duration) => {
              onRecordingComplete(safeIndex, { url, duration });
            }}
          />

          {currentRecording && (
            <p className="text-center text-sm font-medium text-emerald-700">
              Recording uploaded ({currentRecording.duration}s)
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
          No prompts are configured for this speaking section.
        </div>
      )}
    </div>
  );
}
