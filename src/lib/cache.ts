import crypto from 'crypto';

/**
 * Session-scoped in-memory cache for LLM responses.
 * 
 * IMPORTANT SERVERLESS CAVEAT:
 * In a serverless deployment (e.g., Vercel, AWS Lambda), this in-memory cache
 * will ONLY benefit requests hitting the SAME warm function instance. It is NOT
 * a global cross-user or cross-cold-start cache. Use Redis or similar for 
 * global caching in production.
 */
const cache = new Map<string, any>();

export function generateCacheKey(documentText: string, analysisType: string): string {
  return crypto.createHash('sha256').update(`${analysisType}:${documentText}`).digest('hex');
}

export function getCache<T>(key: string): T | null {
  if (cache.has(key)) {
    return cache.get(key) as T;
  }
  return null;
}

export function setCache<T>(key: string, value: T): void {
  cache.set(key, value);
}
