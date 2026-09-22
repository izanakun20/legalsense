import { describe, it, expect, vi, beforeAll } from 'vitest';
import * as parseFileRoute from '../parse-file/route';
import * as analyzeRoute from '../analyze/route';
import fs from 'fs';
import path from 'path';

// Mock the AI call to avoid hitting the real Gemini API in tests
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = {
      generateContent: vi.fn().mockResolvedValue({
        text: JSON.stringify({
          summary: 'Mocked Summary',
          clauses: []
        })
      })
    };
  }
}));

describe('Upload then Analyze Flow', () => {
  beforeAll(() => {
    process.env.GEMINI_API_KEY = 'dummy-key-for-test';
    process.env.GEMINI_MODEL = 'gemini-3.6-flash';
  });

  it('should parse a TXT file and analyze it successfully', async () => {
    const txtBuffer = fs.readFileSync(path.join(process.cwd(), 'test_data/lease_v1.txt'));
    const file = new File([txtBuffer], 'lease_v1.txt', { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', file);
    
    // 1. Upload
    const parseReq = new Request('http://localhost/api/parse-file', { method: 'POST', body: formData });
    const parseRes = await parseFileRoute.POST(parseReq);
    expect(parseRes.status).toBe(200);
    const parseData = await parseRes.json();
    expect(parseData.text).toContain('RESIDENTIAL LEASE AGREEMENT');
    
    // 2. Analyze
    const analyzeReq = new Request('http://localhost/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentText: parseData.text })
    });
    const analyzeRes = await analyzeRoute.POST(analyzeReq);
    expect(analyzeRes.status).toBe(200);
    const analyzeData = await analyzeRes.json();
    expect(analyzeData.summary).toBe('Mocked Summary');
  });

  it('should parse a PDF file and analyze it successfully', async () => {
    const pdfBuffer = fs.readFileSync(path.join(process.cwd(), 'test_data/lease_v1.pdf'));
    const file = new File([pdfBuffer], 'lease_v1.pdf', { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', file);
    
    // 1. Upload
    const parseReq = new Request('http://localhost/api/parse-file', { method: 'POST', body: formData });
    const parseRes = await parseFileRoute.POST(parseReq);
    expect(parseRes.status).toBe(200);
    const parseData = await parseRes.json();
    expect(parseData.text).toContain('RESIDENTIAL LEASE AGREEMENT');
    
    // 2. Analyze
    const analyzeReq = new Request('http://localhost/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentText: parseData.text })
    });
    const analyzeRes = await analyzeRoute.POST(analyzeReq);
    expect(analyzeRes.status).toBe(200);
  });
});
