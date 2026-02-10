'use client';

import React, { ReactNode, useCallback } from 'react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { Pencil1Icon, EraserIcon } from '@radix-ui/react-icons';

interface TextHighlighterProps {
    children: ReactNode;
    enabled?: boolean;
}

export default function TextHighlighter({ children, enabled = true }: TextHighlighterProps) {
    const targetRef = React.useRef<HTMLElement | null>(null);
    const selectionRef = React.useRef<Range | null>(null);

    const handleContextMenu = (event: React.MouseEvent) => {
        targetRef.current = event.target as HTMLElement;

        // Capture the current selection when context menu opens
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
            selectionRef.current = selection.getRangeAt(0).cloneRange();
        } else {
            selectionRef.current = null;
        }
    };

    const handleHighlight = useCallback(() => {
        if (!enabled) return;

        let range = selectionRef.current;

        if (!range) {
            const selection = window.getSelection();
            if (selection && !selection.isCollapsed) {
                range = selection.getRangeAt(0);
            }
        }

        if (!range) return;

        const highlight = document.createElement('mark');
        highlight.className = 'bg-yellow-200 rounded-sm cursor-pointer hover:bg-yellow-300 transition-colors text-black';
        highlight.title = 'Right-click to clear highlight';

        try {
            range.surroundContents(highlight);
            selectionRef.current = null;
            const selection = window.getSelection();
            if (selection) selection.removeAllRanges();
        } catch (e) {
            console.warn('Complex highlighting not supported.', e);
        }
    }, [enabled]);

    const handleClearHighlight = useCallback(() => {
        const target = targetRef.current;
        if (target && target.tagName.toLowerCase() === 'mark') {
            const parent = target.parentNode;
            if (parent) {
                const textContent = target.textContent || '';
                const textNode = document.createTextNode(textContent);
                parent.replaceChild(textNode, target);
                parent.normalize();
            }
        }
    }, []);

    return (
        <ContextMenu.Root>
            <ContextMenu.Trigger
                className="h-full block"
                onContextMenu={handleContextMenu}
            >
                {children}
            </ContextMenu.Trigger>

            {enabled && (
                <ContextMenu.Portal>
                    <ContextMenu.Content
                        className="min-w-[160px] bg-white rounded-md shadow-lg border border-gray-200 p-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                    >
                        <MenuOptions
                            targetRef={targetRef}
                            onHighlight={handleHighlight}
                            onClear={handleClearHighlight}
                        />
                    </ContextMenu.Content>
                </ContextMenu.Portal>
            )}
        </ContextMenu.Root>
    );
}

// Sub-component to read the ref when the menu (Content) mounts.
// This prevents the main TextHighlighter from re-rendering on right-click.
function MenuOptions({
    targetRef,
    onHighlight,
    onClear
}: {
    targetRef: React.MutableRefObject<HTMLElement | null>;
    onHighlight: () => void;
    onClear: () => void;
}) {
    const isHighlightTarget = targetRef.current?.tagName.toLowerCase() === 'mark';

    return (
        <>
            {!isHighlightTarget && (
                <ContextMenu.Item
                    className="group flex items-center px-2 py-1.5 text-sm font-medium text-gray-700 outline-none cursor-pointer rounded hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700"
                    onSelect={onHighlight}
                >
                    <Pencil1Icon className="mr-2 h-4 w-4" />
                    Highlight Selection
                </ContextMenu.Item>
            )}

            {isHighlightTarget && (
                <ContextMenu.Item
                    className="group flex items-center px-2 py-1.5 text-sm font-medium text-gray-700 outline-none cursor-pointer rounded hover:bg-red-50 hover:text-red-700 focus:bg-red-50 focus:text-red-700"
                    onSelect={onClear}
                >
                    <EraserIcon className="mr-2 h-4 w-4" />
                    Clear Highlight
                </ContextMenu.Item>
            )}
        </>
    );
}
