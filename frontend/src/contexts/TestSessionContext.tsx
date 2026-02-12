'use client';

import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { SectionType, Question, Section } from '@/types/test';
import api from '@/lib/api';

interface TestSessionState {
  attemptId: string | null;
  testId: string | null;
  mode: 'full' | 'section_practice';
  currentSectionType: SectionType | null;
  currentSectionIndex: number;
  sections: Section[];
  questions: Record<string, Question[]>; // keyed by sectionId
  answers: Record<string, any>; // keyed by questionId
  answeredQuestions: Set<string>;
  flaggedQuestions: Set<string>;
  sectionTimeRemaining: number;
  timerRunning: boolean;
  isAutoSaving: boolean;
  hasUnsavedChanges: boolean;
  isSubmitting: boolean;
  completedSections: Set<SectionType>;
}

type TestSessionAction =
  | { type: 'INIT_SESSION'; payload: { attemptId: string; testId: string; mode: 'full' | 'section_practice'; sections: Section[] } }
  | { type: 'SET_QUESTIONS'; payload: { sectionId: string; questions: Question[] } }
  | { type: 'SET_ANSWER'; payload: { questionId: string; answer: any } }
  | { type: 'FLAG_QUESTION'; payload: { questionId: string } }
  | { type: 'SET_SECTION'; payload: { sectionType: SectionType; index: number; timeRemaining: number } }
  | { type: 'TICK_TIMER' }
  | { type: 'SET_TIMER_RUNNING'; payload: boolean }
  | { type: 'AUTO_SAVE_START' }
  | { type: 'AUTO_SAVE_COMPLETE' }
  | { type: 'COMPLETE_SECTION'; payload: { sectionType: SectionType } }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'LOAD_SAVED_ANSWERS'; payload: Record<string, any> };

const initialState: TestSessionState = {
  attemptId: null,
  testId: null,
  mode: 'full',
  currentSectionType: null,
  currentSectionIndex: 0,
  sections: [],
  questions: {},
  answers: {},
  answeredQuestions: new Set(),
  flaggedQuestions: new Set(),
  sectionTimeRemaining: 0,
  timerRunning: false,
  isAutoSaving: false,
  hasUnsavedChanges: false,
  isSubmitting: false,
  completedSections: new Set(),
};

function testSessionReducer(state: TestSessionState, action: TestSessionAction): TestSessionState {
  switch (action.type) {
    case 'INIT_SESSION':
      return {
        ...initialState,
        attemptId: action.payload.attemptId,
        testId: action.payload.testId,
        mode: action.payload.mode,
        sections: action.payload.sections,
      };

    case 'SET_QUESTIONS':
      return {
        ...state,
        questions: {
          ...state.questions,
          [action.payload.sectionId]: action.payload.questions,
        },
      };

    case 'SET_ANSWER': {
      const newAnswered = new Set(state.answeredQuestions);
      newAnswered.add(action.payload.questionId);
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.payload.questionId]: action.payload.answer,
        },
        answeredQuestions: newAnswered,
        hasUnsavedChanges: true,
      };
    }

    case 'FLAG_QUESTION': {
      const newFlagged = new Set(state.flaggedQuestions);
      if (newFlagged.has(action.payload.questionId)) {
        newFlagged.delete(action.payload.questionId);
      } else {
        newFlagged.add(action.payload.questionId);
      }
      return { ...state, flaggedQuestions: newFlagged };
    }

    case 'SET_SECTION':
      return {
        ...state,
        currentSectionType: action.payload.sectionType,
        currentSectionIndex: action.payload.index,
        sectionTimeRemaining: action.payload.timeRemaining,
        timerRunning: true,
      };

    case 'TICK_TIMER':
      return {
        ...state,
        sectionTimeRemaining: Math.max(0, state.sectionTimeRemaining - 1),
      };

    case 'SET_TIMER_RUNNING':
      return { ...state, timerRunning: action.payload };

    case 'AUTO_SAVE_START':
      return { ...state, isAutoSaving: true };

    case 'AUTO_SAVE_COMPLETE':
      return { ...state, isAutoSaving: false, hasUnsavedChanges: false };

    case 'COMPLETE_SECTION': {
      const newCompleted = new Set(state.completedSections);
      newCompleted.add(action.payload.sectionType);
      return { ...state, completedSections: newCompleted, timerRunning: false };
    }

    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload };

    case 'LOAD_SAVED_ANSWERS':
      return {
        ...state,
        answers: { ...state.answers, ...action.payload },
        answeredQuestions: new Set([...state.answeredQuestions, ...Object.keys(action.payload)]),
      };

    default:
      return state;
  }
}

interface TestSessionContextType {
  state: TestSessionState;
  dispatch: React.Dispatch<TestSessionAction>;
  autoSave: () => Promise<void>;
  submitSection: (sectionType: SectionType) => Promise<void>;
  submitTest: () => Promise<void>;
}

const TestSessionContext = createContext<TestSessionContextType | undefined>(undefined);

export function TestSessionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(testSessionReducer, initialState);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const autoSave = useCallback(async () => {
    if (!state.attemptId || !state.hasUnsavedChanges) return;

    dispatch({ type: 'AUTO_SAVE_START' });
    try {
      const responses = Object.entries(state.answers).map(([questionId, answerData]) => {
        // Find sectionId for this question
        let sectionId = '';
        for (const [sId, questions] of Object.entries(state.questions)) {
          if (questions.some(q => q.id === questionId)) {
            sectionId = sId;
            break;
          }
        }
        return {
          questionId,
          sectionId,
          answerData,
        };
      }).filter(r => r.sectionId); // Only send responses where we found the sectionId

      if (responses.length === 0) return;

      await api.post(`/attempts/${state.attemptId}/auto-save`, { responses });
      dispatch({ type: 'AUTO_SAVE_COMPLETE' });
    } catch (error) {
      console.error('Auto-save failed:', error);
      dispatch({ type: 'AUTO_SAVE_COMPLETE' });
    }
  }, [state.attemptId, state.answers, state.hasUnsavedChanges]);

  const submitSection = useCallback(async (sectionType: SectionType) => {
    if (!state.attemptId) return;
    await autoSave();
    await api.post(`/attempts/${state.attemptId}/submit-section`, { sectionType });
    dispatch({ type: 'COMPLETE_SECTION', payload: { sectionType } });
  }, [state.attemptId, autoSave]);

  const submitTest = useCallback(async () => {
    if (!state.attemptId) return;
    dispatch({ type: 'SET_SUBMITTING', payload: true });
    try {
      await autoSave();
      await api.post(`/attempts/${state.attemptId}/submit`);
    } finally {
      dispatch({ type: 'SET_SUBMITTING', payload: false });
    }
  }, [state.attemptId, autoSave]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (state.attemptId && state.timerRunning) {
      autoSaveTimerRef.current = setInterval(() => {
        autoSave();
      }, 30000);
    }
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [state.attemptId, state.timerRunning, autoSave]);

  return (
    <TestSessionContext.Provider value={{ state, dispatch, autoSave, submitSection, submitTest }}>
      {children}
    </TestSessionContext.Provider>
  );
}

export function useTestSession() {
  const context = useContext(TestSessionContext);
  if (!context) {
    throw new Error('useTestSession must be used within a TestSessionProvider');
  }
  return context;
}
