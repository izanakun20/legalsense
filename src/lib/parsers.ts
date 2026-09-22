import * as mammoth from 'mammoth';
// @ts-expect-error: Subpath import lacks type declarations, but it's identical to the main module
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { inflateSync } from 'node:zlib';
import { MAX_UPLOAD_SIZE, MAX_PDF_PAGES } from './constants';

function decodePdfString(value: string): string {
  return value.replace(/\\([nrtbf()\\]|[0-7]{1,3})/g, (_, escaped: string) => {
    if (/^[0-7]/.test(escaped)) {
      return String.fromCharCode(parseInt(escaped, 8));
    }
    const replacements: Record<string, string> = {
      n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', '(': '(', ')': ')', '\\': '\\',
    };
    return replacements[escaped] ?? escaped;
  });
}

function decodeAscii85(value: string): Buffer {
  const output: number[] = [];
  let group: number[] = [];

  const flush = (isFinal = false) => {
    if (group.length === 0) return;
    if (group.length === 1) throw new Error('Invalid ASCII85 PDF stream.');
    const length = group.length;
    while (group.length < 5) group.push(84);
    let number = 0;
    for (const digit of group) number = number * 85 + digit;
    const bytes = [(number >>> 24) & 255, (number >>> 16) & 255, (number >>> 8) & 255, number & 255];
    output.push(...bytes.slice(0, isFinal ? length - 1 : 4));
    group = [];
  };

  for (const character of value) {
    if (/\s/.test(character)) continue;
    if (character === '~') break;
    if (character === 'z') {
      if (group.length !== 0) throw new Error('Invalid ASCII85 PDF stream.');
      output.push(0, 0, 0, 0);
      continue;
    }
    const code = character.charCodeAt(0);
    if (code < 33 || code > 117) throw new Error('Invalid ASCII85 PDF stream.');
    group.push(code - 33);
    if (group.length === 5) flush();
  }
  flush(true);
  return Buffer.from(output);
}

function extractFallbackPdfText(buffer: Buffer): string {
  const source = buffer.toString('latin1');
  const pageCount = source.match(/\/Type\s*\/Page\b/g)?.length ?? 0;
  if (pageCount > MAX_PDF_PAGES) {
    throw new Error(`PDF exceeds the maximum allowed page count of ${MAX_PDF_PAGES} pages.`);
  }

  const text: string[] = [];
  const streams = source.matchAll(/\/Filter\s*\[\s*\/ASCII85Decode\s*\/FlateDecode\s*\][\s\S]*?stream\r?\n([\s\S]*?)~>/g);
  for (const stream of streams) {
    const decoded = inflateSync(decodeAscii85(stream[1])).toString('latin1');
    for (const match of decoded.matchAll(/\((?:\\.|[^\\)])*\)\s*Tj/g)) {
      text.push(decodePdfString(match[0].replace(/\)\s*Tj$/, '').slice(1)));
    }
  }
  return text.join('\n').trim();
}

/**
 * Parses a PDF file buffer and extracts text.
 */
export async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    if (data.numpages > MAX_PDF_PAGES) {
      throw new Error(`PDF exceeds the maximum allowed page count of ${MAX_PDF_PAGES} pages.`);
    }
    const text = data.text.trim();
    if (!text) {
      throw new Error("This appears to be a scanned PDF with no text layer. Please upload a text-searchable document.");
    }

    return text;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.startsWith('PDF exceeds') || error.message.startsWith('This appears to be a scanned PDF'))
    ) {
      throw error;
    }
    try {
      const text = extractFallbackPdfText(buffer);
      if (text) return text;
    } catch (fallbackError) {
      if (fallbackError instanceof Error && fallbackError.message.startsWith('PDF exceeds')) {
        throw fallbackError;
      }
    }
    throw new Error('File is corrupted or improperly formatted. Please ensure it is a valid text-based document.');
  }
}

/**
 * Parses a DOCX file buffer and extracts text using mammoth.
 */
export async function parseDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  } catch {
    throw new Error('File is corrupted or improperly formatted. Please ensure it is a valid text-based document.');
  }
}

/**
 * Parses a TXT file buffer.
 */
export async function parseTxt(buffer: Buffer): Promise<string> {
  return buffer.toString('utf-8').trim();
}

function validateMagicBytes(buffer: Buffer, expectedType: 'pdf' | 'docx'): boolean {
  if (buffer.length < 5) return false;
  if (expectedType === 'pdf') {
    // Check for %PDF-
    return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46 && buffer[4] === 0x2D;
  }
  if (expectedType === 'docx') {
    // Check for PK\x03\x04
    return buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;
  }
  return true;
}

/**
 * Main parser entrypoint for file buffers based on mimetype or extension.
 */
export async function parseFileBuffer(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  if (buffer.length > MAX_UPLOAD_SIZE) {
    throw new Error(`File is too large. Maximum size is ${MAX_UPLOAD_SIZE / (1024 * 1024)}MB.`);
  }

  if (filename.endsWith('.pdf') || mimeType === 'application/pdf') {
    if (!validateMagicBytes(buffer, 'pdf')) throw new Error('Invalid PDF format signature.');
    return parsePdf(buffer);
  } else if (filename.endsWith('.docx') || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    if (!validateMagicBytes(buffer, 'docx')) throw new Error('Invalid DOCX format signature.');
    return parseDocx(buffer);
  } else if (filename.endsWith('.txt') || mimeType === 'text/plain') {
    return parseTxt(buffer);
  }
  
  throw new Error('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
}
