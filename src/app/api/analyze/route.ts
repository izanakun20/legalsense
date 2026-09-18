import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateStructuredResponse } from '@/lib/gemini-client';
import { SUMMARIZE_PROMPT, CLAUSE_DETECTION_PROMPT } from '@/lib/prompts';
import { chunkText } from '@/lib/chunking';
import { getCache, setCache, generateCacheKey } from '@/lib/cache';
import { getUserSafeErrorMessage } from '@/lib/errors';
import { sanitizeLogSnippet } from '@/lib/logger';
import { isRateLimited } from '@/lib/rate-limit';

const summarySchema = z.object({ summary: z.string() });
const clausesSchema = z.object({
  clauses: z.array(z.object({
    category: z.string(),
    attentionLevel: z.enum(['High', 'Medium', 'Low']),
    reason: z.string(),
    suggestedQuestion: z.string(),
    quote: z.string()
  }))
});

const requestSchema = z.object({
  documentText: z.string().min(1).max(200000, "Document exceeds the maximum allowed length of 200,000 characters.")
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const { documentText } = requestSchema.parse(body);

    const cacheKey = generateCacheKey(documentText, 'analyze');
    const cachedResult = getCache(cacheKey);
    if (cachedResult) {
      return NextResponse.json(cachedResult);
    }

    const chunks = chunkText(documentText);
    
    // Process summarization
    let finalSummary = "";
    if (chunks.length === 1) {
      const result = await generateStructuredResponse(SUMMARIZE_PROMPT(chunks[0]), summarySchema);
      finalSummary = result.summary;
    } else {
      // Summarize each chunk then combine
      const summaries = await Promise.all(chunks.map(chunk => 
        generateStructuredResponse(SUMMARIZE_PROMPT(chunk), summarySchema)
      ));
      const combinedText = summaries.map(s => s.summary).join("\n\n");
      const finalResult = await generateStructuredResponse(
        `Combine these section summaries into one cohesive document summary:\n${combinedText}`, 
        summarySchema
      );
      finalSummary = finalResult.summary;
    }

    // Process clause detection sequentially to avoid hitting rate limits too quickly
    const allClauses = [];
    for (const chunk of chunks) {
      const result = await generateStructuredResponse(CLAUSE_DETECTION_PROMPT(chunk), clausesSchema);
      allClauses.push(...result.clauses);
    }

    const responseData = {
      summary: finalSummary,
      clauses: allClauses
    };

    setCache(cacheKey, responseData);
    
    console.log(sanitizeLogSnippet({ action: "Analyzed document", chunks: chunks.length }));

    return NextResponse.json(responseData);
  } catch (error) {
    const safeMsg = getUserSafeErrorMessage(error, "Failed to analyze document.");
    return NextResponse.json({ error: safeMsg }, { status: 500 });
  }
}
