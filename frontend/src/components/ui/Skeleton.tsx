'use client';

import { cn } from '@/lib/utils';

type SkeletonVariant = 'text' | 'circle' | 'rect';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
}

function Skeleton({
  variant = 'text',
  width,
  height,
  className,
}: SkeletonProps) {
  const style: React.CSSProperties = {};

  if (width) {
    style.width = typeof width === 'number' ? `${width}px` : width;
  }
  if (height) {
    style.height = typeof height === 'number' ? `${height}px` : height;
  }

  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200',
        variant === 'text' && 'h-4 w-full rounded',
        variant === 'circle' && 'rounded-full',
        variant === 'rect' && 'rounded-lg',
        // Default sizes for circle and rect if not provided
        variant === 'circle' && !width && 'w-10',
        variant === 'circle' && !height && 'h-10',
        variant === 'rect' && !width && 'w-full',
        variant === 'rect' && !height && 'h-24',
        className
      )}
      style={style}
      role="status"
      aria-label="Loading"
      aria-busy="true"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export { Skeleton, type SkeletonProps, type SkeletonVariant };
