/* eslint-disable no-console */
/**
 * Throttle utility for sequential Gemini API calls with configurable delay
 * and 429 backoff.
 */

const DEFAULT_DELAY_MS = parseInt(process.env.EVAL_DELAY_MS || '3000', 10);
const MAX_RETRIES = 3;

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface ThrottledCallResult<T> {
  data: T | null;
  error: string | null;
  retries: number;
  latencyMs: number;
  aborted: boolean;
}

/**
 * Executes a function with delay between calls and 429 backoff.
 * Returns null data if all retries fail (for partial report).
 */
export async function throttledCall<T>(
  fn: () => Promise<T>,
  delayMs: number = DEFAULT_DELAY_MS
): Promise<ThrottledCallResult<T>> {
  let retries = 0;
  let backoffMs = delayMs;

  while (retries <= MAX_RETRIES) {
    const start = Date.now();
    try {
      const data = await fn();
      const latencyMs = Date.now() - start;
      // Add delay between calls
      await sleep(delayMs);
      return { data, error: null, retries, latencyMs, aborted: false };
    } catch (err: unknown) {
      const latencyMs = Date.now() - start;
      const msg = err instanceof Error ? err.message : String(err);
      
      // Check for 429 rate limit
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Too many requests')) {
        retries++;
        if (retries > MAX_RETRIES) {
          return { data: null, error: `Rate limited after ${MAX_RETRIES} retries: ${msg}`, retries, latencyMs, aborted: true };
        }
        console.warn(`[eval-throttle] 429 received, backing off ${backoffMs}ms (retry ${retries}/${MAX_RETRIES})`);
        await sleep(backoffMs);
        backoffMs *= 2; // exponential backoff
        continue;
      }

      // Non-429 error: return immediately
      return { data: null, error: msg, retries, latencyMs, aborted: false };
    }
  }

  return { data: null, error: 'Exhausted retries', retries, latencyMs: 0, aborted: true };
}

/**
 * Estimate the number of API calls for budget reporting.
 */
export function estimateBudget(docCount: number, qaCount: number, compareCount: number): { generatorCalls: number; judgeCalls: number } {
  // Per document: 1 summary + 1 clauses + N Q&A questions
  // Per compare: 1 compare call
  // Judge: 1 per summary + 1 per clause result + 1 per compare
  const generatorCalls = (docCount * 2) + qaCount + compareCount; // summary + clauses per doc + qa + compare
  const judgeCalls = docCount + compareCount; // 1 judge per doc summary + 1 per compare
  return { generatorCalls, judgeCalls };
}
