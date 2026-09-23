import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const WINDOW_MS = 60 * 60 * 1000; // 1 hour

const rateLimitMap = new Map<string, number[]>(); // Local fallback for local dev without KV

let redis: Redis | null = null;
const ratelimiters = new Map<number, Ratelimit>();

export const RATE_LIMITS = {
  PARSE_FILE: 50,
  ANALYZE: 10,
  COMPARE: 10,
  QA: 20,
};

let fallbackWarningLogged = false;

try {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  } else if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch {
  // Failed to initialize Upstash Redis rate limiter
}

import { logger } from '@/lib/logger';

export function logFallbackWarningOnce() {
  if (!redis && !fallbackWarningLogged) {
    logger.warn('Failed to initialize Upstash Redis rate limiter, falling back to in-memory.', 'RATE_LIMITER');
    fallbackWarningLogged = true;
  }
}

function getRateLimiter(maxRequests: number): Ratelimit | null {
  if (!redis) return null;
  if (!ratelimiters.has(maxRequests)) {
    ratelimiters.set(maxRequests, new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, "1 h"),
      analytics: false,
    }));
  }
  return ratelimiters.get(maxRequests)!;
}

export async function isRateLimited(identifier: string, maxRequests: number): Promise<boolean> {
  const ratelimit = getRateLimiter(maxRequests);
  if (ratelimit) {
    try {
      const { success } = await ratelimit.limit(identifier);
      return !success; // True if limited
    } catch (error) {
      logger.error('Redis rate limit check failed, falling back to in-memory', error instanceof Error ? error.message : String(error));
      // Do not return false here; allow it to fall through to the in-memory fallback below
    }
  }

  // Fallback to in-memory sliding window
  logFallbackWarningOnce();
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  
  if (!rateLimitMap.has(identifier)) {
    rateLimitMap.set(identifier, [now]);
    return false;
  }
  
  const timestamps = rateLimitMap.get(identifier)!;
  const filtered = timestamps.filter(t => t > windowStart);
  
  if (filtered.length >= maxRequests) {
    rateLimitMap.set(identifier, filtered);
    return true;
  }
  
  filtered.push(now);
  rateLimitMap.set(identifier, filtered);
  return false;
}
