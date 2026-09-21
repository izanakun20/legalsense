import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isRateLimited } from '../rate-limit';

describe('rate-limit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should allow requests within limit and block when exceeded', async () => {
    // 2 max requests, 1 hour window
    const ip = '127.0.0.1';
    
    // Request 1
    const res1 = await isRateLimited(ip, 2);
    expect(res1).toBe(false);

    // Request 2
    const res2 = await isRateLimited(ip, 2);
    expect(res2).toBe(false);

    // Request 3 (blocked)
    const res3 = await isRateLimited(ip, 2);
    expect(res3).toBe(true);
  });
});
