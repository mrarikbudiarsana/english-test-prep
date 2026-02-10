'use client';

import { forwardRef, useMemo, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  showWordCount?: boolean;
  maxWords?: number;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { label, error, showWordCount, maxWords, className, id, value, defaultValue, ...props },
    ref
  ) => {
    const textareaId =
      id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const wordCount = useMemo(() => {
      const text = String(value ?? defaultValue ?? '');
      if (!text.trim()) return 0;
      return text.trim().split(/\s+/).length;
    }, [value, defaultValue]);

    const isOverLimit = maxWords ? wordCount > maxWords : false;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            value={value}
            defaultValue={defaultValue}
            className={cn(
              'block w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900',
              'placeholder:text-gray-400',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
              'resize-y min-h-[80px]',
              error || isOverLimit
                ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200',
              showWordCount && 'pb-8',
              className
            )}
            aria-invalid={error || isOverLimit ? 'true' : undefined}
            aria-describedby={
              [
                error && textareaId ? `${textareaId}-error` : null,
                showWordCount && textareaId ? `${textareaId}-wordcount` : null,
              ]
                .filter(Boolean)
                .join(' ') || undefined
            }
            {...props}
          />
          {showWordCount && (
            <div
              id={textareaId ? `${textareaId}-wordcount` : undefined}
              className={cn(
                'absolute bottom-2.5 right-3 text-xs',
                isOverLimit ? 'text-red-600 font-medium' : 'text-gray-400'
              )}
              aria-live="polite"
            >
              {wordCount}
              {maxWords ? ` / ${maxWords} words` : ' words'}
            </div>
          )}
        </div>
        {error && (
          <p
            id={textareaId ? `${textareaId}-error` : undefined}
            className="mt-1.5 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea, type TextareaProps };
