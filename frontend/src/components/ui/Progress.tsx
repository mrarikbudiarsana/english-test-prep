'use client';

import { cn } from '@/lib/utils';

type ProgressColor = 'blue' | 'green' | 'yellow' | 'red';

interface ProgressProps {
  value: number;
  className?: string;
  color?: ProgressColor;
  label?: string;
  showValue?: boolean;
}

const colorClasses: Record<ProgressColor, string> = {
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  yellow: 'bg-yellow-500',
  red: 'bg-red-600',
};

function Progress({
  value,
  className,
  color = 'blue',
  label,
  showValue = false,
}: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-sm font-medium text-gray-700">{label}</span>
          )}
          {showValue && (
            <span className="text-sm font-medium text-gray-500">
              {Math.round(clampedValue)}%
            </span>
          )}
        </div>
      )}
      <div
        className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || `Progress: ${Math.round(clampedValue)}%`}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            colorClasses[color]
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}

export { Progress, type ProgressProps, type ProgressColor };
