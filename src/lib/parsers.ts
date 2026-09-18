import * as mammoth from 'mammoth';

/**
 * Parses a PDF file buffer and extracts text.
 */
export async function parsePdf(buffer: Buffer): Promise<string> {
  const pdfParse = require('pdf-parse');
  try {
    const data = await pdfParse(buffer);
    const text = data.text.trim();
    
    // Simple OCR fallback check: if text is empty or very short despite being a PDF
    if (text.length < 50) {
      console.warn("Extracted text from PDF is very short. This might be a scanned document requiring OCR.");
    }
    
    return text;
  } catch (error) {
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
  } catch (error) {
    throw new Error('File is corrupted or improperly formatted. Please ensure it is a valid text-based document.');
  }
}

/**
 * Parses a TXT file buffer.
 */
export async function parseTxt(buffer: Buffer): Promise<string> {
  return buffer.toString('utf-8').trim();
}

/**
 * Main parser entrypoint for file buffers based on mimetype or extension.
 */
export async function parseFileBuffer(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  if (filename.endsWith('.pdf') || mimeType === 'application/pdf') {
    return parsePdf(buffer);
  } else if (filename.endsWith('.docx') || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return parseDocx(buffer);
  } else if (filename.endsWith('.txt') || mimeType === 'text/plain') {
    return parseTxt(buffer);
  }
  
  throw new Error('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
}
