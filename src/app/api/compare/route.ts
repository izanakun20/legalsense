import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateGuardedResponse } from '@/lib/guard/output-guard';
import { verifyQuote, GuardMeta } from '@/lib/guard/quote-verifier';
import { COMPARE_PROMPT } from '@/lib/prompts';
import { getUserSafeErrorMessage } from '@/lib/errors';
import { isRateLimited } from '@/lib/rate-limit';

const requestSchema = z.object({
  doc1Text: z.string().min(1).max(200000, "Document exceeds the maximum allowed length of 200,000 characters."),
  doc2Text: z.string().min(1).max(200000, "Document exceeds the maximum allowed length of 200,000 characters.")
});

const compareSchema = z.object({
  changes: z.array(z.object({
    type: z.enum(['Added', 'Removed', 'Modified']),
    description: z.string(),
    quoteDoc1: z.string().nullable(),
    quoteDoc2: z.string().nullable()
  }))
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
    if (await isRateLimited(`compare:${ip}`, 5)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const { doc1Text, doc2Text } = requestSchema.parse(body);

    const { data: result, forbiddenPhraseReplaced } = await generateGuardedResponse(COMPARE_PROMPT(doc1Text, doc2Text), compareSchema);

    const guard: GuardMeta = {
      forbiddenPhraseReplaced,
      unverifiedQuoteCount: 0,
      unverifiedItems: []
    };

    // Verify quotes
    result.changes.forEach((change, index) => {
      let unverified = false;
      if (change.quoteDoc1 && !verifyQuote(change.quoteDoc1, doc1Text)) {
        change.quoteDoc1 = null;
        unverified = true;
      }
      if (change.quoteDoc2 && !verifyQuote(change.quoteDoc2, doc2Text)) {
        change.quoteDoc2 = null;
        unverified = true;
      }
      if (unverified) {
        guard.unverifiedQuoteCount++;
        guard.unverifiedItems?.push({ type: 'change', index });
      }
    });

    if (guard.forbiddenPhraseReplaced || guard.unverifiedQuoteCount > 0) {
      return NextResponse.json({ ...result, guard });
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    const safeMsg = getUserSafeErrorMessage(error, "Failed to compare documents.");
    return NextResponse.json({ error: safeMsg }, { status: 500 });
  }
}
