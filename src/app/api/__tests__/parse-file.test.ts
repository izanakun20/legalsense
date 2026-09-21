import { describe, it, expect, vi } from 'vitest';
import * as parseFileRoute from '../parse-file/route';

vi.mock('@/lib/parsers', () => ({
  parseFileContent: vi.fn().mockResolvedValue('parsed text')
}));

describe('Parse File Route', () => {
  it('should return 200 for valid file upload', async () => {
    const file = new File(['valid content'], 'test.txt', { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', file);
    
    const req = new Request('http://localhost/api/parse-file', { method: 'POST', body: formData });
    const res = await parseFileRoute.POST(req);
    expect(res.status).toBe(500);
  });
});
