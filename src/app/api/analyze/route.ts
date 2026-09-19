import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateStructuredResponse } from '@/lib/gemini-client';
import { SUMMARIZE_PROMPT, CLAUSE_DETECTION_PROMPT } from '@/lib/prompts';
import { chunkText } from '@/lib/chunking';
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
    if (await isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const { documentText } = requestSchema.parse(body);

    const chunks = chunkText(documentText);

    if (chunks.length > 5) {
      return NextResponse.json({ error: "Document is too large and exceeds the maximum allowed processing budget (5 chunks)." }, { status: 400 });
    }
    
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
      
      // Verify quotes
      result.clauses.forEach(clause => {
        if (clause.quote && !documentText.includes(clause.quote)) {
          clause.quote = "Quote omitted because it wasn't an exact match in the text.";
        }
      });
      
      allClauses.push(...result.clauses);
    }

    const responseData = {
      summary: finalSummary,
      clauses: allClauses
    };
    
    console.log(sanitizeLogSnippet({ action: "Analyzed document", chunks: chunks.length }));

    return NextResponse.json(responseData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    const safeMsg = getUserSafeErrorMessage(error, "Failed to analyze document.");
    return NextResponse.json({ error: safeMsg }, { status: 500 });
  }
}
