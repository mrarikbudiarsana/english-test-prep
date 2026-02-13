import { ExamType } from '@/types/user';
import {
  HiOutlineVolumeUp,
  HiOutlineBookOpen,
  HiOutlinePencil,
  HiOutlineMicrophone,
  HiOutlineTemplate,
} from 'react-icons/hi';
import { IconType } from 'react-icons';

export interface SectionConfig {
  key: string;
  label: string;
  icon: IconType;
}

export interface ExamTheme {
  // Main brand color (hex)
  primary: string;
  // Darker shade for hover states
  primaryDark: string;
  // Light tint for backgrounds
  secondary: string;
  // Very light tint for hero/page bg
  heroTint1: string;
  heroTint2: string;
  // Border color (light)
  border: string;
  // Tailwind gradient classes (for buttons, icons, badges)
  gradient: string;
  // Tailwind gradient for hero blob 1 & 2
  blob1: string;
  blob2: string;
  // Progress bar & active accents
  progressBar: string;
  // Stat card 1 (tests completed) background
  stat1Bg: string;
  // Chart line/area color
  chartColor: string;
}

export interface ExamConfig {
  name: string;
  shortName: string;
  description: string;
  scoreLabel: string;
  scoreRange: { min: number; max: number };
  scorePrecision: number;
  sections: SectionConfig[];
  theme: ExamTheme;
  /** @deprecated use theme.gradient */
  colors: { primary: string; secondary: string; gradient: string };
  testTypes: string[];
}

export const examConfigs: Record<ExamType, ExamConfig> = {
  ielts: {
    name: 'IELTS',
    shortName: 'IELTS',
    description: 'International English Language Testing System',
    scoreLabel: 'Band Score',
    scoreRange: { min: 0, max: 9 },
    scorePrecision: 0.5,
    sections: [
      { key: 'listening', label: 'Listening', icon: HiOutlineVolumeUp },
      { key: 'reading', label: 'Reading', icon: HiOutlineBookOpen },
      { key: 'writing', label: 'Writing', icon: HiOutlinePencil },
      { key: 'speaking', label: 'Speaking', icon: HiOutlineMicrophone },
    ],
    theme: {
      primary: '#e4002b',
      primaryDark: '#b8001e',
      secondary: '#ffe5ea',
      heroTint1: '#fff0f2',
      heroTint2: '#ffe5ea',
      border: '#ffc4ce',
      gradient: 'from-red-500 to-red-600',
      blob1: '#ffe5ea',
      blob2: '#ffc4ce',
      progressBar: '#e4002b',
      stat1Bg: '#fff0f2',
      chartColor: '#e4002b',
    },
    colors: { primary: '#e4002b', secondary: '#ffe5ea', gradient: 'from-red-500 to-red-600' },
    testTypes: ['academic', 'general_training'],
  },
  toefl_ibt: {
    name: 'TOEFL iBT',
    shortName: 'iBT',
    description: 'Test of English as a Foreign Language — Internet Based',
    scoreLabel: 'Score',
    scoreRange: { min: 0, max: 120 },
    scorePrecision: 1,
    sections: [
      { key: 'reading', label: 'Reading', icon: HiOutlineBookOpen },
      { key: 'listening', label: 'Listening', icon: HiOutlineVolumeUp },
      { key: 'speaking', label: 'Speaking', icon: HiOutlineMicrophone },
      { key: 'writing', label: 'Writing', icon: HiOutlinePencil },
    ],
    theme: {
      // TOEFL brand periwinkle-purple (#8B82D4 from official TOEFL app)
      primary: '#7B6FD4',
      primaryDark: '#5D51B8',
      secondary: '#ede9fb',
      heroTint1: '#f5f3fe',
      heroTint2: '#ede9fb',
      border: '#c4baf5',
      gradient: 'from-violet-500 to-violet-600',
      blob1: '#ede9fb',
      blob2: '#c4baf5',
      progressBar: '#7B6FD4',
      stat1Bg: '#f5f3fe',
      chartColor: '#7B6FD4',
    },
    colors: { primary: '#7B6FD4', secondary: '#ede9fb', gradient: 'from-violet-500 to-violet-600' },
    testTypes: ['toefl_ibt'],
  },
  toefl_itp: {
    name: 'TOEFL ITP',
    shortName: 'ITP',
    description: 'Test of English as a Foreign Language — Institutional Testing Program',
    scoreLabel: 'Score',
    scoreRange: { min: 310, max: 677 },
    scorePrecision: 1,
    sections: [
      { key: 'listening', label: 'Listening Comprehension', icon: HiOutlineVolumeUp },
      { key: 'structure', label: 'Structure and Written Expression', icon: HiOutlineTemplate },
      { key: 'reading', label: 'Reading Comprehension', icon: HiOutlineBookOpen },
    ],
    theme: {
      // TOEFL brand — darker purple to distinguish from iBT
      primary: '#5848B8',
      primaryDark: '#3D329A',
      secondary: '#e5e2f8',
      heroTint1: '#f0eefc',
      heroTint2: '#e5e2f8',
      border: '#b3acec',
      gradient: 'from-purple-600 to-purple-700',
      blob1: '#e5e2f8',
      blob2: '#b3acec',
      progressBar: '#5848B8',
      stat1Bg: '#f0eefc',
      chartColor: '#5848B8',
    },
    colors: { primary: '#5848B8', secondary: '#e5e2f8', gradient: 'from-purple-600 to-purple-700' },
    testTypes: ['toefl_itp'],
  },
  pte: {
    name: 'PTE Academic',
    shortName: 'PTE',
    description: 'Pearson Test of English Academic',
    scoreLabel: 'Score',
    scoreRange: { min: 10, max: 90 },
    scorePrecision: 1,
    sections: [
      { key: 'speaking', label: 'Speaking & Writing', icon: HiOutlineMicrophone },
      { key: 'reading', label: 'Reading', icon: HiOutlineBookOpen },
      { key: 'listening', label: 'Listening', icon: HiOutlineVolumeUp },
    ],
    theme: {
      // Pearson brand teal (#0097A7 from official Pearson logo)
      primary: '#0097A7',
      primaryDark: '#00717E',
      secondary: '#ccf2f5',
      heroTint1: '#e6fafb',
      heroTint2: '#ccf2f5',
      border: '#80dfe5',
      gradient: 'from-cyan-600 to-teal-600',
      blob1: '#ccf2f5',
      blob2: '#80dfe5',
      progressBar: '#0097A7',
      stat1Bg: '#e6fafb',
      chartColor: '#0097A7',
    },
    colors: { primary: '#0097A7', secondary: '#ccf2f5', gradient: 'from-cyan-600 to-teal-600' },
    testTypes: ['pte_academic'],
  },
};

/**
 * Get exam config by exam type
 */
export function getExamConfig(examType: ExamType): ExamConfig {
  return examConfigs[examType];
}

/**
 * Get all exam types
 */
export function getAllExamTypes(): ExamType[] {
  return Object.keys(examConfigs) as ExamType[];
}

/**
 * Map exam type to test types for API filtering
 */
export function getTestTypesForExam(examType: ExamType): string[] {
  return examConfigs[examType].testTypes;
}
