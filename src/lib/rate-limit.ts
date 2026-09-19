import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // Strict budget for expensive AI calls

const rateLimitMap = new Map<string, number[]>(); // Local fallback for local dev without KV

let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

try {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MAX_REQUESTS, "1 m"),
      analytics: false,
    });
  }
} catch (e) {
  console.warn("Failed to initialize Upstash Redis rate limiter, falling back to in-memory.");
}

export async function isRateLimited(identifier: string): Promise<boolean> {
  if (ratelimit) {
    try {
      const { success } = await ratelimit.limit(identifier);
      return !success; // True if limited
    } catch (e) {
      console.error("Rate limit check failed, bypassing...", e);
      return false; // Fail open to not break app if Redis is unreachable
    }
  }

  // Fallback to in-memory sliding window
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  
  if (!rateLimitMap.has(identifier)) {
    rateLimitMap.set(identifier, [now]);
    return false;
  }
  
  const timestamps = rateLimitMap.get(identifier)!;
  const filtered = timestamps.filter(t => t > windowStart);
  
  if (filtered.length >= MAX_REQUESTS) {
    rateLimitMap.set(identifier, filtered);
    return true;
  }
  
  filtered.push(now);
  rateLimitMap.set(identifier, filtered);
  return false;
}
