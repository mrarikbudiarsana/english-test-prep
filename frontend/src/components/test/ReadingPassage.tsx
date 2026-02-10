'use client';

import { useRef, useMemo, memo } from 'react';
import TextHighlighter from './TextHighlighter';

interface ReadingPassageProps {
  title: string;
  content: string;
  highlightEnabled?: boolean;
}

function ReadingPassage({
  title,
  content,
  highlightEnabled = false,
}: ReadingPassageProps) {
  const contentRef = useRef<HTMLDivElement>(null);




  const processedContent = content?.replace(/\n/g, '<br />') || '';

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}


      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <TextHighlighter enabled={highlightEnabled}>
          <h2 className="text-xl font-bold text-gray-900 mb-6">{title}</h2>
          <div
            ref={contentRef}
            className="prose prose-sm max-w-none text-gray-800 leading-relaxed
              prose-headings:text-gray-900 prose-headings:font-semibold
              prose-p:mb-4 prose-p:text-gray-700
              prose-strong:text-gray-900
              prose-em:text-gray-600
              selection:bg-blue-100"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        </TextHighlighter>
      </div>
    </div>
  );
}

export default memo(ReadingPassage);
