import * as mammoth from 'mammoth';
// @ts-expect-error: Subpath import lacks type declarations, but it's identical to the main module
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { MAX_UPLOAD_SIZE, MAX_PDF_PAGES } from './constants';

/**
 * Parses a PDF file buffer and extracts text.
 */
export async function parsePdf(buffer: Buffer): Promise<string> {
  let data;
  try {
    data = await pdfParse(buffer);
  } catch {
    throw new Error('File is corrupted or improperly formatted. Please ensure it is a valid text-based document.');
  }

  if (data.numpages > MAX_PDF_PAGES) {
    throw new Error(`PDF exceeds the maximum allowed page count of ${MAX_PDF_PAGES} pages.`);
  }

  const text = data.text.trim();
  if (!text) {
    throw new Error("This appears to be a scanned PDF with no text layer. Please upload a text-searchable document.");
  }
  
  return text;
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
