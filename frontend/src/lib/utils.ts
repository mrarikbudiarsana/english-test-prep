import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatScore(score: number | null, precision: number = 1): string {
  if (score === null || score === undefined) return '-';
  if (precision === 1) {
    return Math.round(score).toString();
  }
  const rounded = Math.round(score * 2) / 2;
  return rounded % 1 === 0 ? `${rounded}.0` : `${rounded}`;
}

export const formatBand = (band: number | null) => formatScore(band, 1);

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
  if (band >= 600) return 'text-green-600';
  if (band >= 500) return 'text-blue-600';
  if (band >= 460) return 'text-yellow-600';
  return 'text-red-600';
}

export function getBandBgColor(band: number): string {
  if (band >= 600) return 'bg-green-100 border-green-300';
  if (band >= 500) return 'bg-blue-100 border-blue-300';
  if (band >= 460) return 'bg-yellow-100 border-yellow-300';
  return 'bg-red-100 border-red-300';
}

export function getScoreColor(score: number, _testType?: string): string {
  return getBandColor(score);
}

export function getScoreBgColor(score: number, _testType?: string): string {
  return getBandBgColor(score);
}

export function sectionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    listening: 'Listening',
    reading: 'Reading',
    structure: 'Structure and Written Expression',
  };
  return labels[type] || type;
}

export function questionTypeLabel(type: string): string {
  if (type === 'multiple_choice') return 'Multiple Choice';
  return type;
}

export function testTypeLabel(_testType: string): string {
  return 'TOEFL ITP';
}

export function testTypeShortLabel(_testType: string): string {
  return 'TOEFL ITP';
}

export function examNameFromTestType(_testType: string): string {
  return 'TOEFL ITP';
}

export function sectionCountForTestType(_testType: string): number {
  return 3;
}

export function usesBandScale(_testType: string): boolean {
  return false;
}
