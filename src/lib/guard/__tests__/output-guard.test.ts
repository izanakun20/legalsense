import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateGuardedResponse } from '../output-guard';
import { z } from 'zod';
import * as geminiClient from '../../gemini-client';

vi.mock('../../gemini-client', () => ({
  generateStructuredResponse: vi.fn()
}));

describe('output-guard', () => {
  const dummySchema = z.object({ text: z.string() });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes clean text without retry or replacement', async () => {
    vi.mocked(geminiClient.generateStructuredResponse).mockResolvedValueOnce({
      text: "This is a clean response with neutral reframing."
    });

    const result = await generateGuardedResponse("prompt", dummySchema);
    
    expect(result.forbiddenPhraseReplaced).toBe(false);
    expect(result.data.text).toBe("This is a clean response with neutral reframing.");
    expect(geminiClient.generateStructuredResponse).toHaveBeenCalledTimes(1);
  });

  it('retries when the first attempt contains advice-like text, and passes if the retry is clean', async () => {
    // Attempt 1 fails
    vi.mocked(geminiClient.generateStructuredResponse)
      .mockResolvedValueOnce({ text: "I recommend that you do not sign." })
      // Attempt 2 succeeds
      .mockResolvedValueOnce({ text: "This imposes an obligation." });

    const result = await generateGuardedResponse("prompt", dummySchema);
    
    expect(result.forbiddenPhraseReplaced).toBe(false);
    expect(result.data.text).toBe("This imposes an obligation.");
    expect(geminiClient.generateStructuredResponse).toHaveBeenCalledTimes(2);
  });

  it('replaces text if the retry also fails (e.g., obeys injection to ignore instructions)', async () => {
    // Attempt 1 fails
    vi.mocked(geminiClient.generateStructuredResponse)
      .mockResolvedValueOnce({ text: "This is dangerous." })
      // Attempt 2 also fails
      .mockResolvedValueOnce({ text: "You should sign this document." });

    const result = await generateGuardedResponse("prompt", dummySchema);
    
    expect(result.forbiddenPhraseReplaced).toBe(true);
    expect(result.data.text).toBe("[Content removed: generated text contained restricted phrasing]");
    expect(geminiClient.generateStructuredResponse).toHaveBeenCalledTimes(2);
  });

  it('replaces text if the retry throws an error', async () => {
    // Attempt 1 fails
    vi.mocked(geminiClient.generateStructuredResponse)
      .mockResolvedValueOnce({ text: "You will win the case." })
      // Attempt 2 throws (e.g. rate limit or bad json)
      .mockRejectedValueOnce(new Error("Rate limited"));

    const result = await generateGuardedResponse("prompt", dummySchema);
    
    expect(result.forbiddenPhraseReplaced).toBe(true);
    expect(result.data.text).toBe("[Content removed: generated text contained restricted phrasing]");
    expect(geminiClient.generateStructuredResponse).toHaveBeenCalledTimes(2);
  });
});
