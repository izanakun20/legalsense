/**
 * Sanitizes log snippets to ensure no document text, titles, or filenames are logged.
 * Strips API keys, Bearer tokens, and fields like rawText, content, prompt, summary, etc.
 */
export function sanitizeLogSnippet<T>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeLogSnippet(item)) as unknown as T;
  }
  
  const sanitized = { ...obj } as Record<string, unknown>;
  const sensitiveKeys = [
    'rawtext', 'content', 'prompt', 'summary', 'filename', 
    'title', 'key', 'token', 'authorization', 'api_key'
  ];
  
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeLogSnippet(sanitized[key]);
    }
  }
  
  return sanitized as unknown as T;
}
