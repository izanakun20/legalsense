import { describe, it, expect, vi } from 'vitest';
import * as route from '../parse-file/route';

vi.mock('pdf-parse', () => {
  return {
    default: vi.fn()
  }
});

describe('parse-file route canary', () => {
  it('asserts 405 Method Not Allowed for GET by verifying GET is not exported', async () => {
    // Next.js App Router handles 405 automatically if GET is not exported.
    // We verify it's not exported to ensure the 405 behavior.
    expect(('GET' in route)).toBe(false);
  });

  it('asserts 400 for POST with no file', async () => {
    const formData = new FormData(); // Empty form data, no file
    const req = new Request('http://localhost/api/parse-file', {
      method: 'POST',
      body: formData,
      headers: {
        'x-forwarded-for': '127.0.0.1',
      }
    });

    const res = await route.POST(req);
    expect(res.status).toBe(400);
    
    const json = await res.json();
    expect(json.error).toBe('No file provided');
  });
});
