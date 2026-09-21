import { describe, it, expect } from 'vitest';
import { sanitizeLogSnippet } from '../logger';

describe('logger - sanitizeLogSnippet', () => {
  it('should redact sensitive keys', () => {
    const input = {
      prompt: 'secret',
      title: 'secret_title',
      public_data: 'ok'
    };
    const output = sanitizeLogSnippet(input);
    expect(output.prompt).toBe('[REDACTED]');
    expect(output.title).toBe('[REDACTED]');
    expect(output.public_data).toBe('ok');
  });

  it('should handle null or non-objects', () => {
    expect(sanitizeLogSnippet(null)).toBeNull();
    expect(sanitizeLogSnippet('string')).toBe('string');
  });

  it('should redact nested objects and arrays', () => {
    const input = {
      arr: [{ api_key: '123' }]
    };
    const output = sanitizeLogSnippet(input);
    expect((output as { arr: { api_key: string }[] }).arr[0].api_key).toBe('[REDACTED]');
  });
});
