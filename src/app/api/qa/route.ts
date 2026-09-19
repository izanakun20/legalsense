import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateStructuredResponse } from '@/lib/gemini-client';
import { QA_PROMPT } from '@/lib/prompts';
import { getUserSafeErrorMessage } from '@/lib/errors';
import { sanitizeLogSnippet } from '@/lib/logger';
import { isRateLimited } from '@/lib/rate-limit';

const requestSchema = z.object({
  documentText: z.string().min(1).max(200000, "Document exceeds the maximum allowed length of 200,000 characters."),
  question: z.string().min(1).max(500, "Question is too long.")
});

const qaSchema = z.object({
  answer: z.string(),
  quote: z.string().nullable(),
  outOfScope: z.boolean()
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
    if (await isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    const { documentText, question } = requestSchema.parse(body);

    const result = await generateStructuredResponse(QA_PROMPT(documentText, question), qaSchema);

    // Verify citation to prevent hallucinated quotes
    if (result.quote && !documentText.includes(result.quote)) {
      result.quote = null; // drop hallucinated quote
    }

    console.log(sanitizeLogSnippet({ action: "Q&A answered" }));

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    const safeMsg = getUserSafeErrorMessage(error, "Failed to answer question.");
    return NextResponse.json({ error: safeMsg }, { status: 500 });
  }
}
