import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateGuardedResponse } from '@/lib/guard/output-guard';
import { verifyQuote, GuardMeta } from '@/lib/guard/quote-verifier';
import { QA_PROMPT } from '@/lib/prompts';
import { getUserSafeErrorMessage } from '@/lib/errors';
import { isRateLimited, RATE_LIMITS } from '@/lib/rate-limit';

const requestSchema = z.object({
  documentText: z.string().min(1).max(200000, "Document exceeds the maximum allowed length of 200,000 characters."),
  question: z.string().min(1).max(500, "Question is too long.")
});

const qaSchema = z.object({
  answer: z.string(),
  quote: z.string().nullable(),
  outOfScope: z.boolean()
});

export const maxDuration = 60;
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0] ?? '127.0.0.1';
    if (await isRateLimited(`qa:${ip}`, RATE_LIMITS.QA)) {
      return NextResponse.json({ error: 'Lots of people are using LegalSense right now. Please try again in about 30 seconds.' }, { status: 429, headers: { 'Retry-After': '30' } });
    }

    const body = await req.json();
    const { documentText, question } = requestSchema.parse(body);

    const { data: result, forbiddenPhraseReplaced } = await generateGuardedResponse(QA_PROMPT(documentText, question), qaSchema);

    const guard: GuardMeta = {
      forbiddenPhraseReplaced,
      unverifiedQuoteCount: 0
    };

    // Verify citation to prevent hallucinated quotes
    if (result.quote && !verifyQuote(result.quote, documentText)) {
      result.quote = null; // drop hallucinated quote
      result.answer = "I can't find support for this in the document.";
      guard.unverifiedQuoteCount++;
    }

    if (!guard.forbiddenPhraseReplaced && guard.unverifiedQuoteCount === 0) {
      return NextResponse.json(result);
    }
    
    return NextResponse.json({ ...result, guard });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    const safeMsg = getUserSafeErrorMessage(error, "Failed to answer question.");
    return NextResponse.json({ error: safeMsg }, { status: 500 });
  }
}
