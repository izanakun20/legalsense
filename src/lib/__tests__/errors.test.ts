import { describe, it, expect } from 'vitest';
import { getUserSafeErrorMessage } from '../errors';

describe('errors', () => {
  it('should let whitelisted errors through', () => {
    const error = new Error('Too many requests, try again later');
    const msg = getUserSafeErrorMessage(error);
    expect(msg).toContain('Too many requests');
  });

  it('should suppress generic error', () => {
    const msg = getUserSafeErrorMessage(new Error('Generic failure'));
    expect(msg).toBe('An unexpected error occurred.');
  });

  it('should use fallback if unknown error', () => {
    const msg = getUserSafeErrorMessage(null, 'Fallback');
    expect(msg).toBe('Fallback');
  });
});
