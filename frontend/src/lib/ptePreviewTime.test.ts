import assert from 'node:assert/strict';
import { formatLastValidatedAgo } from './ptePreviewTime';

function test(name: string, fn: () => void): void {
  try {
    fn();
    // Keep output minimal but readable in CI logs.
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

const now = 1_700_000_000_000;

test('returns null when timestamp is missing', () => {
  assert.equal(formatLastValidatedAgo(null, now), null);
});

test('formats seconds under a minute', () => {
  assert.equal(formatLastValidatedAgo(now - 12_000, now), 'Last validated 12s ago');
});

test('formats minutes under an hour', () => {
  assert.equal(formatLastValidatedAgo(now - 5 * 60_000, now), 'Last validated 5m ago');
});

test('formats hours at or above one hour', () => {
  assert.equal(formatLastValidatedAgo(now - 3 * 60 * 60_000, now), 'Last validated 3h ago');
});

test('clamps future timestamps to zero seconds', () => {
  assert.equal(formatLastValidatedAgo(now + 30_000, now), 'Last validated 0s ago');
});

test('switches from seconds to minutes at 60 seconds', () => {
  assert.equal(formatLastValidatedAgo(now - 59_000, now), 'Last validated 59s ago');
  assert.equal(formatLastValidatedAgo(now - 60_000, now), 'Last validated 1m ago');
});

test('switches from minutes to hours at 60 minutes', () => {
  assert.equal(formatLastValidatedAgo(now - 59 * 60_000, now), 'Last validated 59m ago');
  assert.equal(formatLastValidatedAgo(now - 60 * 60_000, now), 'Last validated 1h ago');
});
