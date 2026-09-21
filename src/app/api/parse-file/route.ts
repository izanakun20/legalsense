import { NextResponse } from 'next/server';
import { parseFileBuffer } from '@/lib/parsers';
import { MAX_UPLOAD_SIZE } from '@/lib/constants';
import { getUserSafeErrorMessage } from '@/lib/errors';
import { isRateLimited } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
    if (await isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_UPLOAD_SIZE) {
      return NextResponse.json({ error: `Payload too large. Maximum size is ${MAX_UPLOAD_SIZE / (1024 * 1024)}MB.` }, { status: 413 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const text = await parseFileBuffer(buffer, file.name, file.type);
    
    if (text.length === 0) {
      return NextResponse.json({ error: 'The document contains no extractable text.' }, { status: 400 });
    }

    if (text.length > 200000) {
      return NextResponse.json({ error: 'Document exceeds the maximum allowed length of 200,000 characters.' }, { status: 400 });
    }

    // Do not log document text or filenames

    return NextResponse.json({ text });
  } catch (error) {
    const safeMsg = getUserSafeErrorMessage(error, "Failed to parse the uploaded file.");
    const isCorrupt = error instanceof Error && error.message.includes('corrupted or improperly formatted');
    return NextResponse.json({ error: isCorrupt ? error.message : safeMsg }, { status: isCorrupt ? 400 : 500 });
  }
}
