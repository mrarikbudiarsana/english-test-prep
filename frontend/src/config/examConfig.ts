import { ExamType } from '@/types/user';
import { HiOutlineVolumeUp, HiOutlineBookOpen, HiOutlineTemplate } from 'react-icons/hi';
import { IconType } from 'react-icons';

export interface SectionConfig {
  key: string;
  label: string;
  icon: IconType;
}

export interface ExamTheme {
  primary: string;
  primaryDark: string;
  secondary: string;
  heroTint1: string;
  heroTint2: string;
  border: string;
  gradient: string;
  blob1: string;
  blob2: string;
  progressBar: string;
  stat1Bg: string;
  chartColor: string;
}

export interface ExamConfig {
  name: string;
  shortName: string;
  description: string;
  scoreLabel: string;
  scoreRange: { min: number; max: number };
  sectionScoreRange: { min: number; max: number };
  scorePrecision: number;
  sections: SectionConfig[];
  theme: ExamTheme;
  colors: { primary: string; secondary: string; gradient: string };
  testTypes: string[];
}

export const examConfigs: Record<ExamType, ExamConfig> = {
  toefl_itp: {
    name: 'TOEFL ITP',
    shortName: 'ITP',
    description: 'Test of English as a Foreign Language - Institutional Testing Program',
    scoreLabel: 'Estimated Score',
    scoreRange: { min: 310, max: 677 },
    sectionScoreRange: { min: 31, max: 68 },
    scorePrecision: 1,
    sections: [
      { key: 'listening', label: 'Listening Comprehension', icon: HiOutlineVolumeUp },
      { key: 'structure', label: 'Structure and Written Expression', icon: HiOutlineTemplate },
      { key: 'reading', label: 'Reading Comprehension', icon: HiOutlineBookOpen },
    ],
    theme: {
      primary: '#08507f',
      primaryDark: '#063d61',
      secondary: '#e8f4fd',
      heroTint1: '#f8fafc',
      heroTint2: '#f1f5f9',
      border: '#e2e8f0',
      gradient: 'from-[#063d61] to-[#08507f]',
      blob1: '#e8f4fd',
      blob2: '#cbd5e1',
      progressBar: '#08507f',
      stat1Bg: '#e8f4fd',
      chartColor: '#08507f',
    },
    colors: { primary: '#08507f', secondary: '#e8f4fd', gradient: 'from-[#063d61] to-[#08507f]' },
    testTypes: ['toefl_itp'],
  },
};

export function getExamConfig(examType: ExamType): ExamConfig {
  return examConfigs[examType];
}

export function getAllExamTypes(): ExamType[] {
  return ['toefl_itp'];
}

export function getTestTypesForExam(examType: ExamType): string[] {
  return examType === 'toefl_itp' ? ['toefl_itp'] : [];
}
