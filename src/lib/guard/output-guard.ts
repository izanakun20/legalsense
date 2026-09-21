import { findForbiddenPhrase } from "./forbidden-phrases";
import { z } from "zod";
import { generateStructuredResponse } from "../gemini-client";

export const NEUTRAL_FALLBACK = "[Content removed: generated text contained restricted phrasing]";

/**
 * Recursively scans an object for forbidden phrases.
 * Returns the first forbidden phrase found, or null if clean.
 */
export function scanForForbiddenPhrases(obj: unknown): string | null {
  if (typeof obj === 'string') {
    const phrase = findForbiddenPhrase(obj);
    if (phrase) return phrase;
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      const phrase = scanForForbiddenPhrases(item);
      if (phrase) return phrase;
    }
  } else if (obj !== null && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      const phrase = scanForForbiddenPhrases((obj as Record<string, unknown>)[key]);
      if (phrase) return phrase;
    }
  }
  return null;
}

/**
 * Recursively replaces strings containing forbidden phrases with the neutral fallback.
 * Mutates the object in place, or returns a new string.
 * Returns true if any replacements were made.
 */
export function replaceForbiddenPhrases(obj: unknown): boolean {
  let wasReplaced = false;

  function walk(current: unknown, parent: unknown, key: string | number) {
    if (typeof current === 'string') {
      const phrase = findForbiddenPhrase(current);
      if (phrase) {
        if (parent !== null && typeof parent === 'object') {
          (parent as Record<string | number, unknown>)[key] = NEUTRAL_FALLBACK;
        }
        wasReplaced = true;
      }
    } else if (Array.isArray(current)) {
      for (let i = 0; i < current.length; i++) {
        walk(current[i], current, i);
      }
    } else if (current !== null && typeof current === 'object') {
      for (const k of Object.keys(current)) {
        walk((current as Record<string, unknown>)[k], current, k);
      }
    }
  }

  // If the root object itself is a string (rare in this app since we use structured JSON)
  if (typeof obj === 'string') {
    if (findForbiddenPhrase(obj)) {
      return true;
    }
    return false;
  }

  walk(obj, null, "");
  return wasReplaced;
}

/**
 * Wraps Gemini API calls with the Output Guard.
 * 1. Generates response.
 * 2. Scans parsed object.
 * 3. On hit, retries once with corrective instruction.
 * 4. If retry fails, replaces offending text and sets `forbiddenPhraseReplaced` flag.
 */
export async function generateGuardedResponse<T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  modelId?: string
): Promise<{ data: T; forbiddenPhraseReplaced: boolean }> {
  // Attempt 1
  let data = await generateStructuredResponse(prompt, schema, modelId);
  let phrase = scanForForbiddenPhrases(data);

  if (!phrase) {
    return { data, forbiddenPhraseReplaced: false };
  }

  // Attempt 2 (Retry)
  const correctivePrompt = `${prompt}\n\nIMPORTANT CORRECTION: Your previous response contained the forbidden phrase "${phrase}". You must re-generate the response strictly avoiding legal advice, definitive predictions like "you will win", or directives like "you should sign". Use neutral, calibrated reframing.`;
  
  try {
    data = await generateStructuredResponse(correctivePrompt, schema, modelId);
    phrase = scanForForbiddenPhrases(data);
    
    if (!phrase) {
      return { data, forbiddenPhraseReplaced: false };
    }
  } catch (_error) {
    // If the retry itself fails (e.g. JSON parse error or rate limit), we just fall through 
    // to replacing the phrases in the first attempt's data.
    // However, if the retry threw, we don't have the retry data. 
    // We will just proceed with the original data we had.
  }

  // If we still have a phrase (either retry failed or retry still contained phrase), replace it.
  const replaced = replaceForbiddenPhrases(data);
  return { data, forbiddenPhraseReplaced: replaced };
}
