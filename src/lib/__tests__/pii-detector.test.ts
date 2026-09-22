import { expect, test, describe } from 'vitest';
import { detectPII } from '../pii-detector';

describe('pii-detector', () => {
  test('should detect valid Credit Card via Luhn', () => {
    // Valid test card
    const text = 'Here is my card: 4242 4242 4242 4242';
    const matches = detectPII(text);
    expect(matches).toContainEqual({ type: 'Credit Card', value: '4242 4242 4242 4242' });
  });

  test('should ignore invalid Credit Card (fails Luhn)', () => {
    // Invalid test card
    const text = 'Here is a fake card: 49927398717';
    const matches = detectPII(text);
    expect(matches).not.toContainEqual(expect.objectContaining({ type: 'Credit Card' }));
  });

  test('should detect SSN', () => {
    const text = 'My SSN is 123-45-6789.';
    const matches = detectPII(text);
    expect(matches).toContainEqual({ type: 'SSN', value: '123-45-6789' });
  });

  test('should detect Email', () => {
    const text = 'Contact me at test.email+123@example.co.uk please.';
    const matches = detectPII(text);
    expect(matches).toContainEqual({ type: 'Email', value: 'test.email+123@example.co.uk' });
  });

  test('should detect Phone Number', () => {
    const text = 'Call me at (555) 123-4567 or 800-555-1234.';
    const matches = detectPII(text);
    expect(matches).toContainEqual({ type: 'Phone Number', value: '(555) 123-4567' });
    expect(matches).toContainEqual({ type: 'Phone Number', value: '800-555-1234' });
  });

  test('should detect National ID shape', () => {
    const text = 'License number: ABC-1234-XYZ.';
    const matches = detectPII(text);
    expect(matches).toContainEqual({ type: 'National ID', value: 'ABC-1234-XYZ' });
  });
  
  test('should not have false positives on normal numbers', () => {
    const text = 'The year is 2026 and I have 100 apples. Order #12345.';
    const matches = detectPII(text);
    expect(matches.length).toBe(0);
  });
});
