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

export function formatBand(band: number | null): string {
  if (band === null) return '-';
  return band % 1 === 0 ? `${band}.0` : `${band}`;
}

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
  if (band >= 7.5) return 'text-green-600';
  if (band >= 6.0) return 'text-blue-600';
  if (band >= 5.0) return 'text-yellow-600';
  return 'text-red-600';
}

export function getBandBgColor(band: number): string {
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
