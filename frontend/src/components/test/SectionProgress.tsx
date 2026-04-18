'use client';

import React from 'react';
import { SectionType } from '@/types/test';

interface SectionProgressProps {
  sections: SectionType[];
  currentSection: SectionType;
  completedSections: Set<SectionType>;
}

const sectionIcons: Record<SectionType, React.ReactNode> = {
  listening: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
  ),
  reading: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  structure: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  ),
};

const sectionLabels: Record<SectionType, string> = {
  listening: 'Listening',
  reading: 'Reading',
  structure: 'Structure',
};

export default function SectionProgress({
  sections,
  currentSection,
  completedSections,
}: SectionProgressProps) {
  const getStepStatus = (section: SectionType) => {
    if (completedSections.has(section)) return 'completed';
    if (section === currentSection) return 'current';
    return 'upcoming';
  };

  return (
    <nav className="w-full">
      <ol className="flex items-center">
        {sections.map((section, index) => {
          const status = getStepStatus(section);
          const isLast = index === sections.length - 1;

          return (
            <li
              key={section}
              className={`flex items-center ${isLast ? '' : 'flex-1'}`}
            >
              {/* Step Circle + Label */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`
                    flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-500 ease-out
                    ${status === 'completed'
                      ? 'border-green-500 bg-green-500 text-white'
                      : status === 'current'
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-300 bg-white text-gray-400'
                    }
                  `}
                >
                  {status === 'completed' ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    sectionIcons[section]
                  )}
                </div>
                <span
                  className={`text-xs font-medium transition-colors duration-500 ease-out ${status === 'completed'
                    ? 'text-green-600'
                    : status === 'current'
                      ? 'text-blue-600'
                      : 'text-gray-400'
                    }`}
                >
                  {sectionLabels[section]}
                </span>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div className="mx-2 mt-[-1.25rem] h-0.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`
                      h-full origin-left transform rounded-full bg-green-500
                      transition-transform duration-500 ease-out
                      ${completedSections.has(section) ? 'scale-x-100' : 'scale-x-0'}
                    `}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
