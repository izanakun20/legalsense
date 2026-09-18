import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { generateStructuredResponse } from '../gemini-client';

// Mock the @google/genai module
vi.mock('@google/genai', () => {
  const mockGenerateContent = vi.fn();
  return {
    GoogleGenAI: class {
      models = {
        generateContent: mockGenerateContent
      }
    }
  };
});

describe('gemini-client', () => {
  const schema = z.object({
    result: z.string()
  });

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = "test_key";
  });

  it('should parse valid JSON correctly', async () => {
    const { GoogleGenAI } = await import('@google/genai');
    const instance = new GoogleGenAI();
    const mockGenerateContent = instance.models.generateContent as unknown as import('vitest').Mock;
    
    mockGenerateContent.mockResolvedValueOnce({
      text: '{"result": "success"}'
    });

    const data = await generateStructuredResponse("test prompt", schema);
    expect(data.result).toBe("success");
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('should repair and parse JSON wrapped in markdown fences', async () => {
    const { GoogleGenAI } = await import('@google/genai');
    const instance = new GoogleGenAI();
    const mockGenerateContent = instance.models.generateContent as unknown as import('vitest').Mock;
    
    mockGenerateContent.mockResolvedValueOnce({
      text: '```json\n{"result": "success"}\n```'
    });

    const data = await generateStructuredResponse("test prompt", schema);
    expect(data.result).toBe("success");
  });

  it('should retry once if JSON is malformed and fails to repair', async () => {
    const { GoogleGenAI } = await import('@google/genai');
    const instance = new GoogleGenAI();
    const mockGenerateContent = instance.models.generateContent as unknown as import('vitest').Mock;
    
    // First call returns completely unparseable garbage
    mockGenerateContent.mockResolvedValueOnce({
      text: 'This is not json at all'
    });
    
    // Second call returns valid JSON
    mockGenerateContent.mockResolvedValueOnce({
      text: '{"result": "success on retry"}'
    });

    const data = await generateStructuredResponse("test prompt", schema);
    expect(data.result).toBe("success on retry");
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    
    // Check that the retry prompt contains the corrective instruction
    const secondCallPrompt = mockGenerateContent.mock.calls[1][0].contents;
    expect(secondCallPrompt).toContain('Your last response was not valid JSON');
  });

  it('should throw error if both attempts fail', async () => {
    const { GoogleGenAI } = await import('@google/genai');
    const instance = new GoogleGenAI();
    const mockGenerateContent = instance.models.generateContent as unknown as import('vitest').Mock;
    
    mockGenerateContent.mockResolvedValue({
      text: 'Garbage'
    });

    await expect(generateStructuredResponse("test prompt", schema)).rejects.toThrow(/Failed to generate valid structured output after 2 attempts/);
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });
});
