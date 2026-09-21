import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isRateLimited } from '@/lib/rate-limit';
import * as analyzeRoute from '../analyze/route';
import * as qaRoute from '../qa/route';

vi.mock('@/lib/rate-limit', () => ({
  isRateLimited: vi.fn(),
  RATE_LIMITS: { ANALYZE: 10, QA: 20, COMPARE: 10, PARSE_FILE: 50 }
}));

describe('API Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('analyze route returns 429 when rate limited', async () => {
    const isRateLimitedMock = isRateLimited as import('vitest').Mock;
    isRateLimitedMock.mockResolvedValue(true);
    const req = new Request('http://localhost/api/analyze', { method: 'POST', body: JSON.stringify({ documentText: 'test' }) });
    const res = await analyzeRoute.POST(req);
    expect(res.status).toBe(429);
  });

  it('qa route returns 429 when rate limited', async () => {
    const isRateLimitedMock = isRateLimited as import('vitest').Mock;
    isRateLimitedMock.mockResolvedValue(true);
    const req = new Request('http://localhost/api/qa', { method: 'POST', body: JSON.stringify({ documentText: 'test', question: 'Q', chatHistory: [] }) });
    const res = await qaRoute.POST(req);
    expect(res.status).toBe(429);
  });
});
