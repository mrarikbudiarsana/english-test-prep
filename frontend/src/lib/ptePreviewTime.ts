export function formatLastValidatedAgo(validatedAt: number | null, nowTs: number): string | null {
  if (!validatedAt) return null;

  const diffSeconds = Math.max(0, Math.floor((nowTs - validatedAt) / 1000));
  if (diffSeconds < 60) return `Last validated ${diffSeconds}s ago`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `Last validated ${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  return `Last validated ${diffHours}h ago`;
}
