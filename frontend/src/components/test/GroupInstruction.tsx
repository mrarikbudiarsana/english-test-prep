'use client';

/**
 * Renders formatted text with bold markers (**text**) and newline support.
 */
export function renderFormattedText(text: string) {
    if (!text) return null;
    // Split by bold markers (**text**)
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return (
        <span>
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
                }
                return <span key={i}>{part}</span>;
            })}
        </span>
    );
}

interface GroupInstructionProps {
    groupLabel: string;
    groupInstructions?: string | null;
    /** Optional: use a different style variant */
    variant?: 'default' | 'compact';
}

/**
 * A unified component for rendering group instruction headers (e.g., "Questions 1-7").
 * Ensures consistent styling across all question types and sections.
 */
export default function GroupInstruction({
    groupLabel,
    groupInstructions,
    variant = 'default',
}: GroupInstructionProps) {
    return (
        <div className={
            variant === 'compact'
                ? 'mb-4 pl-0'
                : 'mb-6 pl-0'
        }>
            <h3 className="text-lg font-bold text-black mb-2">
                {groupLabel}
            </h3>
            {groupInstructions && (
                <p className="text-base text-black leading-relaxed whitespace-pre-wrap">
                    {renderFormattedText(groupInstructions)}
                </p>
            )}
        </div>
    );
}
