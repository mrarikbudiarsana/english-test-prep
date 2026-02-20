import { type ClassValue, clsx } from 'clsx';

// Simple cn utility without tailwind-merge dependency
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatScore(score: number | null, precision: number = 0.5): string {
  if (score === null || score === undefined) return '-';

  // If precision is 1 (integer), return without decimals
  if (precision === 1) {
    return Math.round(score).toString();
  }

  // For 0.5 precision (IELTS), ensure 1 decimal place
  // Round to nearest 0.5
  const rounded = Math.round(score * 2) / 2;
  return rounded % 1 === 0 ? `${rounded}.0` : `${rounded}`;
}

/** @deprecated Use formatScore instead */
export const formatBand = (band: number | null) => formatScore(band, 0.5);

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number, currency = 'IDR'): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function getBandColor(band: number): string {
  // Handle TOEFL / High scores (assumed if > 9)
  if (band > 9) {
    if (band >= 600) return 'text-green-600';
    if (band >= 500) return 'text-blue-600';
    if (band >= 460) return 'text-yellow-600';
    return 'text-red-600';
  }

  if (band >= 7.5) return 'text-green-600';
  if (band >= 6.0) return 'text-blue-600';
  if (band >= 5.0) return 'text-yellow-600';
  return 'text-red-600';
}

export function getBandBgColor(band: number): string {
  // Handle TOEFL / High scores (assumed if > 9)
  if (band > 9) {
    if (band >= 600) return 'bg-green-100 border-green-300';
    if (band >= 500) return 'bg-blue-100 border-blue-300';
    if (band >= 460) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  }

  if (band >= 7.5) return 'bg-green-100 border-green-300';
  if (band >= 6.0) return 'bg-blue-100 border-blue-300';
  if (band >= 5.0) return 'bg-yellow-100 border-yellow-300';
  return 'bg-red-100 border-red-300';
}

export function sectionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    listening: 'Listening',
    reading: 'Reading',
    writing: 'Writing',
    speaking: 'Speaking',
    structure: 'Structure and Written Expression',
  };
  return labels[type] || type;
}

export function questionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    multiple_choice: 'Multiple Choice',
    true_false_not_given: 'True/False/Not Given',
    yes_no_not_given: 'Yes/No/Not Given',
    completion: 'Completion',
    matching: 'Matching',
    dropdown: 'Dropdown',
  };
  return labels[type] || type;
}

export function testTypeLabel(testType: string): string {
  const labels: Record<string, string> = {
    academic: 'IELTS Academic',
    general_training: 'IELTS General Training',
    toefl_ibt: 'TOEFL iBT',
    toefl_itp: 'TOEFL ITP',
    pte_academic: 'PTE Academic',
  };
  return labels[testType] || testType;
}

export function testTypeShortLabel(testType: string): string {
  const labels: Record<string, string> = {
    academic: 'Academic',
    general_training: 'General Training',
    toefl_ibt: 'TOEFL iBT',
    toefl_itp: 'TOEFL ITP',
    pte_academic: 'PTE Academic',
  };
  return labels[testType] || testType;
}

export function examNameFromTestType(testType: string): string {
  if (testType === 'academic' || testType === 'general_training') return 'IELTS';
  if (testType === 'toefl_ibt') return 'TOEFL iBT';
  if (testType === 'toefl_itp') return 'TOEFL ITP';
  if (testType === 'pte_academic') return 'PTE';
  return 'English';
}

export function sectionCountForTestType(testType: string): number {
  if (testType === 'toefl_itp') return 3;
  if (testType === 'pte_academic') return 3;
  return 4;
}

export function usesBandScale(testType: string): boolean {
  return testType === 'academic' || testType === 'general_training' || testType === 'toefl_ibt';
}
