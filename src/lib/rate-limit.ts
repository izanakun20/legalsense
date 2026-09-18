/**
 * Simple in-memory sliding-window rate limiter.
 * Limits each IP to 100 requests per minute.
 * 
 * NOTE: For serverless deployments, this is per-instance. 
 * A Redis-backed store (like @upstash/ratelimit) is recommended for production.
 */

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100;
const rateLimitMap = new Map<string, number[]>();

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, [now]);
    return false;
  }
  
  const timestamps = rateLimitMap.get(ip)!;
  const filtered = timestamps.filter(t => t > windowStart);
  
  if (filtered.length >= MAX_REQUESTS) {
    rateLimitMap.set(ip, filtered);
    return true;
  }
  
  filtered.push(now);
  rateLimitMap.set(ip, filtered);
  return false;
}
