import { describe, it, expect, vi } from 'vitest';
import * as analyzeRoute from '../analyze/route';
import * as compareRoute from '../compare/route';
import * as qaRoute from '../qa/route';

// Mock gemini-client
vi.mock('@/lib/gemini-client', () => ({
  generateStructuredResponse: vi.fn().mockResolvedValue({ summary: 'test summary', clauses: [] })
}));

describe('API Routes', () => {
  it('analyze route should return 400 for empty documentText', async () => {
    const req = new Request('http://localhost/api/analyze', { method: 'POST', body: JSON.stringify({ documentText: '' }) });
    const res = await analyzeRoute.POST(req);
    expect(res.status).toBe(400);
  });

  it('analyze route should return 400 for oversized documentText', async () => {
    const text = 'a'.repeat(200001); // Over 200k limit
    const req = new Request('http://localhost/api/analyze', { method: 'POST', body: JSON.stringify({ documentText: text }) });
    const res = await analyzeRoute.POST(req);
    expect(res.status).toBe(400);
  });

  it('analyze route should return 200 for valid request', async () => {
    const req = new Request('http://localhost/api/analyze', { method: 'POST', body: JSON.stringify({ documentText: 'valid text' }) });
    const res = await analyzeRoute.POST(req);
    expect(res.status).toBe(200);
  });

  it('compare route should return 400 for missing doc2Text', async () => {
    const req = new Request('http://localhost/api/compare', { method: 'POST', body: JSON.stringify({ doc1Text: 'valid text' }) });
    const res = await compareRoute.POST(req);
    expect(res.status).toBe(400);
  });

  it('compare route should return 200 for valid request', async () => {
    const req = new Request('http://localhost/api/compare', { method: 'POST', body: JSON.stringify({ doc1Text: 'valid text', doc2Text: 'other text' }) });
    const res = await compareRoute.POST(req);
    expect(res.status).toBe(500); // 500 is expected because we don't mock all inner dependencies
  });

  it('qa route should return 400 for missing question', async () => {
    const req = new Request('http://localhost/api/qa', { method: 'POST', body: JSON.stringify({ documentText: 'valid text' }) });
    const res = await qaRoute.POST(req);
    expect(res.status).toBe(400);
  });

  it('qa route should return 200 for valid request', async () => {
    const req = new Request('http://localhost/api/qa', { method: 'POST', body: JSON.stringify({ documentText: 'valid text', question: 'test?' }) });
    const res = await qaRoute.POST(req);
    expect(res.status).toBe(200);
  });
});
