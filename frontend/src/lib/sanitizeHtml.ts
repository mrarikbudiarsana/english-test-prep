import DOMPurify from 'dompurify';

// Allowed tags for TOEFL ITP reading passages
const ALLOWED_TAGS = [
  'div', 'span', 'p', 'br',
  'strong', 'b', 'em', 'i', 'u',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'blockquote', 'pre', 'code',
  'sup', 'sub',
  'mark',
];

// Allowed attributes (class for styling, id for navigation)
const ALLOWED_ATTR = ['class', 'id', 'style'];

/**
 * Sanitize HTML content for TOEFL ITP passages.
 * Strips dangerous content while preserving safe formatting.
 */
export function sanitizeToeflPassage(html: string): string {
  if (typeof window === 'undefined') {
    // Server-side: return escaped content for safety
    return html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    KEEP_CONTENT: true,
  });
}

/**
 * Check if content contains HTML tags.
 * Used to determine whether to sanitize or process as plain text.
 */
export function containsHtmlTags(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}
