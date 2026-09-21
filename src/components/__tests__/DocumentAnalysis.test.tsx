// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { DocumentAnalysis } from '../DocumentAnalysis';

// Mock scrollTo to avoid jsdom error
window.scrollTo = vi.fn();

test('DocumentAnalysis renders guard fallback notices', async () => {
  // Mock fetch
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({
      summary: "This is a summary.",
      clauses: [],
      guard: {
        forbiddenPhraseReplaced: true,
        unverifiedQuoteCount: 1,
        unverifiedItems: [{ type: 'summary', index: 0 }]
      }
    })
  });

  render(<DocumentAnalysis documentText="Test doc" />);

  const guardNotice = await screen.findByText(/Part of this result was replaced or left unverified/i);
  expect(guardNotice).toBeInTheDocument();
});
