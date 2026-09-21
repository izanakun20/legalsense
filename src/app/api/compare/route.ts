import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateStructuredResponse } from '@/lib/gemini-client';
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
    if (await isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const { doc1Text, doc2Text } = requestSchema.parse(body);

    const result = await generateStructuredResponse(COMPARE_PROMPT(doc1Text, doc2Text), compareSchema);

    // Verify quotes
    result.changes.forEach(change => {
      if (change.quoteDoc1 && !doc1Text.includes(change.quoteDoc1)) {
        change.quoteDoc1 = null;
      }
      if (change.quoteDoc2 && !doc2Text.includes(change.quoteDoc2)) {
        change.quoteDoc2 = null;
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    const safeMsg = getUserSafeErrorMessage(error, "Failed to compare documents.");
    return NextResponse.json({ error: safeMsg }, { status: 500 });
  }
}
