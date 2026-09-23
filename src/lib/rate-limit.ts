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

export let debugDiagnostics: any = { redis: false, init: "none", urlLen: 0, tokenLen: 0, envs: {} };

try {
  debugDiagnostics.envs = {
    KV_REST_API_URL: !!process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
    UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: !!process.env.UPSTASH_REDIS_REST_TOKEN
  };
  
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    debugDiagnostics.init = "manual (KV)";
    debugDiagnostics.urlLen = process.env.KV_REST_API_URL.length;
    debugDiagnostics.tokenLen = process.env.KV_REST_API_TOKEN.length;
    redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  } else if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    debugDiagnostics.init = "manual (UPSTASH)";
    debugDiagnostics.urlLen = process.env.UPSTASH_REDIS_REST_URL.length;
    debugDiagnostics.tokenLen = process.env.UPSTASH_REDIS_REST_TOKEN.length;
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  debugDiagnostics.redis = !!redis;
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
  if (identifier === "DEBUG_TRIGGER") {
    throw new Error(JSON.stringify(debugDiagnostics));
  }
  const ratelimit = getRateLimiter(maxRequests);
  if (ratelimit) {
    try {
      const { success } = await ratelimit.limit(identifier);
      return !success; // True if limited
    } catch (e) {
      debugDiagnostics.identifier = identifier;
      debugDiagnostics.config = `${maxRequests} per 1 h`;
      const errStr = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      debugDiagnostics.error = errStr.substring(0, 300);
      return false; // Fail open to not break app if Redis is unreachable
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
