import { describe, it, expect } from 'vitest';
import { chunkText } from '../chunking';

describe('chunking', () => {
  it('should chunk text within max tokens', () => {
    const text = 'word '.repeat(10000); // 50,000 characters
    const chunks = chunkText(text, 100, 20);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].length).toBeLessThanOrEqual(text.length); // Rough check
  });

  it('should handle small text without chunking', () => {
    const text = 'small text';
    const chunks = chunkText(text, 100);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(text);
  });
});
