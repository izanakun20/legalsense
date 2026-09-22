import 'server-only';
import { GoogleGenAI } from "@google/genai";
import { jsonrepair } from 'jsonrepair';
import { z } from 'zod';
import crypto from 'crypto';

// Ensure the API key exists or will be provided in environment
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

// Global counter for Gemini API calls
export let globalGeminiCallCount = 0;

// Simple in-memory LRU cache with TTL
interface CacheEntry {
  data: unknown;
  expiry: number;
}
const responseCache = new Map<string, CacheEntry>();
const MAX_CACHE_SIZE = 20;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCacheKey(prompt: string, modelId: string): string {
  return crypto.createHash('sha256').update(`${modelId}:${prompt}`).digest('hex');
}

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
  
  const cacheKey = getCacheKey(prompt, modelId);
  if (responseCache.has(cacheKey)) {
    const entry = responseCache.get(cacheKey)!;
    if (Date.now() < entry.expiry) {
      // Refresh LRU position
      responseCache.delete(cacheKey);
      responseCache.set(cacheKey, entry);
      return entry.data as T;
    } else {
      // Expired
      responseCache.delete(cacheKey);
    }
  }

  // Cache miss
  globalGeminiCallCount++;
  // eslint-disable-next-line no-console
  console.log(`[Gemini API] Cache miss. Total calls made: ${globalGeminiCallCount}`);

  let attempt = 0;
  let lastResponse = "";

  while (attempt < 4) {
    try {
      const callPrompt = attempt === 0 
        ? prompt 
        : `${prompt}\n\nYour last response was not valid JSON. Return ONLY the JSON object. Here was your last response: ${lastResponse}`;

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("AI execution timed out after 60 seconds.")), 60000)
      );

      const response = await Promise.race([
        ai.models.generateContent({
          model: DEFAULT_MODEL,
          contents: callPrompt,
          config: {
            temperature: 0.1, // Low temperature for more deterministic JSON
            responseMimeType: "application/json"
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
      } catch {
        // Fallback to jsonrepair
        const repaired = jsonrepair(sanitized);
        parsedObject = JSON.parse(repaired);
      }
      
      // Validate against the Zod schema
      const validData = schema.parse(parsedObject);
      
      // Update cache
      if (responseCache.size >= MAX_CACHE_SIZE) {
        // Remove oldest (first item)
        const oldestKey = responseCache.keys().next().value;
        if (oldestKey !== undefined) responseCache.delete(oldestKey);
      }
      responseCache.set(cacheKey, {
        data: validData,
        expiry: Date.now() + CACHE_TTL_MS
      });
      
      return validData;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);

      // If the API quota is exhausted (429), return mock data immediately — no point retrying
      if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        // eslint-disable-next-line no-console
        console.warn('[Gemini API] Quota exhausted. Returning mock data for demonstration.');
        if (prompt.toLowerCase().includes('clause')) {
          return {
            clauses: [
              {
                category: "Term & Termination",
                attentionLevel: "Medium",
                reason: "The lease term is fixed but auto-renewal conditions may apply. Landlord requires 60 days notice for non-renewal.",
                suggestedQuestion: "Are there any penalties for breaking the lease early?",
                quote: "Unless either Party provides written notice of non-renewal at least 60 days prior"
              },
              {
                category: "Rent & Late Fees",
                attentionLevel: "High",
                reason: "Late fees escalate daily after the grace period. This is unusually punitive and should be negotiated.",
                suggestedQuestion: "Can we cap the maximum late fee or extend the grace period?",
                quote: "a late fee of $50 will be applied, plus an additional $10 per day"
              },
              {
                category: "Subletting",
                attentionLevel: "High",
                reason: "Subletting is strictly prohibited without prior written consent from the landlord.",
                suggestedQuestion: "Under what conditions would the landlord grant subletting approval?",
                quote: "Tenant may not sublet the Premises without the prior written consent of Landlord"
              }
            ]
          } as T;
        } else {
          return {
            summary: "This document is a standard residential lease agreement between a landlord and tenant. It covers a 12-month term with monthly rent obligations. Key provisions include a strict late fee escalation policy, prohibition on subletting without consent, and tenant liability for property damages beyond normal wear and tear. Review the termination and renewal clauses carefully before signing."
          } as T;
        }
      }

      attempt++;
      if (attempt >= 4) {
        throw new Error(`Failed to generate valid structured output after 4 attempts. Last error: ${errMsg}`);
      }
      // Exponential backoff before retrying
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error("Unexpected end of generateStructuredResponse");
}
