import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateGuardedResponse } from '@/lib/guard/output-guard';
import { verifyQuote, GuardMeta } from '@/lib/guard/quote-verifier';
import { SUMMARIZE_PROMPT, CLAUSE_DETECTION_PROMPT } from '@/lib/prompts';
import { chunkText } from '@/lib/chunking';
import { getUserSafeErrorMessage } from '@/lib/errors';
import { isRateLimited, RATE_LIMITS } from '@/lib/rate-limit';

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

type Clause = z.infer<typeof clausesSchema>['clauses'][0];

const requestSchema = z.object({
  documentText: z.string().min(1).max(200000, "Document exceeds the maximum allowed length of 200,000 characters.")
});

export const maxDuration = 10;
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0] ?? '127.0.0.1';
    if (await isRateLimited(`analyze:${ip}`, RATE_LIMITS.ANALYZE)) {
      return NextResponse.json({ error: 'Lots of people are using LegalSense right now. Please try again in about 30 seconds.' }, { status: 429, headers: { 'Retry-After': '30' } });
    }

    const body = await req.json();
    const { documentText } = requestSchema.parse(body);

    const chunks = chunkText(documentText);

    if (chunks.length > 5) {
      return NextResponse.json({ error: "Document is too large and exceeds the maximum allowed processing budget (5 chunks)." }, { status: 400 });
    }
    
    const guard: GuardMeta = {
      forbiddenPhraseReplaced: false,
      unverifiedQuoteCount: 0,
      unverifiedItems: []
    };

    // Process summarization
    let finalSummary = "";
    if (chunks.length === 1) {
      const result = await generateGuardedResponse(SUMMARIZE_PROMPT(chunks[0]), summarySchema);
      finalSummary = result.data.summary;
      if (result.forbiddenPhraseReplaced) guard.forbiddenPhraseReplaced = true;
    } else {
      // Summarize each chunk then combine
      const summaries = await Promise.all(chunks.map(chunk => 
        generateGuardedResponse(SUMMARIZE_PROMPT(chunk), summarySchema)
      ));
      if (summaries.some(s => s.forbiddenPhraseReplaced)) guard.forbiddenPhraseReplaced = true;
      const combinedText = summaries.map(s => s.data.summary).join("\n\n");
      const finalResult = await generateGuardedResponse(
        `Combine these section summaries into one cohesive document summary:\n${combinedText}`, 
        summarySchema
      );
      finalSummary = finalResult.data.summary;
      if (finalResult.forbiddenPhraseReplaced) guard.forbiddenPhraseReplaced = true;
    }

    // Process clause detection in parallel for efficiency
    const allClauses: Clause[] = [];
    
    const chunkResults = await Promise.all(chunks.map(chunk => 
      generateGuardedResponse(CLAUSE_DETECTION_PROMPT(chunk), clausesSchema)
    ));
    
    chunkResults.forEach((result) => {
      if (result.forbiddenPhraseReplaced) guard.forbiddenPhraseReplaced = true;
      
      // Verify quotes
      result.data.clauses.forEach((clause: Clause, index: number) => {
        if (clause.quote && !verifyQuote(clause.quote, documentText)) {
          clause.quote = "Quote omitted because it wasn't an exact match in the text.";
          guard.unverifiedQuoteCount++;
          guard.unverifiedItems?.push({ type: 'clause', index: allClauses.length + index });
        }
      });
      
      allClauses.push(...result.data.clauses);
    });

    const responseData: { summary: string; clauses: Record<string, unknown>[]; guard?: GuardMeta } = {
      summary: finalSummary,
      clauses: allClauses
    };

    if (guard.forbiddenPhraseReplaced || guard.unverifiedQuoteCount > 0) {
      responseData.guard = guard;
    }
    
    return NextResponse.json(responseData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    const safeMsg = getUserSafeErrorMessage(error, "Failed to analyze document.");
    // eslint-disable-next-line no-console
    console.error("API Analyze Error:", error);
    return NextResponse.json({ error: safeMsg }, { status: 500 });
  }
}
