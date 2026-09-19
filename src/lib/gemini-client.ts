import { GoogleGenAI } from '@google/genai';
import { jsonrepair } from 'jsonrepair';
import { z } from 'zod';

// Ensure the API key exists or will be provided in environment
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

/**
 * JSON Sanitization:
 * - Strips markdown code fences
 * - Extracts the outermost { } or [ ]
 * - Normalizes smart quotes
 */
function sanitizeJsonString(raw: string): string {
  let cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
  cleaned = cleaned.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  
  const isObject = firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket);
  
  if (isObject) {
    return cleaned.substring(firstBrace, lastBrace + 1);
  } else if (firstBracket !== -1 && lastBracket !== -1) {
    return cleaned.substring(firstBracket, lastBracket + 1);
  }
  
  return cleaned;
}

/**
 * Generates a structured response from Gemini, handling JSON repair and a single retry.
 */
export async function generateStructuredResponse<T>(
  prompt: string, 
  schema: z.ZodSchema<T>, 
  modelId: string = DEFAULT_MODEL
): Promise<T> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  
  let attempt = 0;
  let lastResponse = "";

  while (attempt < 2) {
    try {
      const callPrompt = attempt === 0 
        ? prompt 
        : `${prompt}\n\nYour last response was not valid JSON. Return ONLY the JSON object. Here was your last response: ${lastResponse}`;

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("AI execution timed out after 30 seconds.")), 30000)
      );

      const response = await Promise.race([
        ai.models.generateContent({
          model: modelId,
          contents: callPrompt,
          config: {
            temperature: 0.1, // Low temperature for more deterministic JSON
          }
        }),
        timeoutPromise
      ]) as Awaited<ReturnType<typeof ai.models.generateContent>>;
      
      const rawText = response.text || "";
      lastResponse = rawText;
      
      const sanitized = sanitizeJsonString(rawText);
      
      let parsedObject;
      try {
        parsedObject = JSON.parse(sanitized);
      } catch (parseError) {
        // Fallback to jsonrepair
        const repaired = jsonrepair(sanitized);
        parsedObject = JSON.parse(repaired);
      }
      
      // Validate against the Zod schema
      return schema.parse(parsedObject);
    } catch (error) {
      attempt++;
      if (attempt >= 2) {
        throw new Error(`Failed to generate valid structured output after 2 attempts. Error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }
  }
  
  throw new Error("Unexpected end of generateStructuredResponse");
}
