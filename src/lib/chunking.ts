/**
 * chunking.ts
 * Implements chunking strategy as per TECH_STACK.md rules:
 * - Gate single-pass vs batched processing on TOTAL CHARACTER COUNT only.
 * - Default: under ~45,000 chars -> single LLM call, full text.
 * - Chunk by character length with a reasonable overlap (200-400 chars) to avoid losing clauses.
 * - NEVER hard-truncate document text.
 */

export const MAX_SINGLE_PASS_LENGTH = 45000;
export const CHUNK_OVERLAP = 300;

/**
 * Checks if a document can be processed in a single LLM pass.
 */
export function canSinglePass(text: string): boolean {
  return text.length <= MAX_SINGLE_PASS_LENGTH;
}

/**
 * Splits a text into chunks based on character length with a specified overlap.
 * This is used for documents that exceed the MAX_SINGLE_PASS_LENGTH.
 */
export function chunkText(text: string, maxLength: number = MAX_SINGLE_PASS_LENGTH, overlap: number = CHUNK_OVERLAP): string[] {
  if (canSinglePass(text)) {
    return [text];
  }

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + maxLength;

    // If we're not at the end of the text, try to find a natural break (newline or space)
    if (endIndex < text.length) {
      const lastNewline = text.lastIndexOf('\n', endIndex);
      const lastSpace = text.lastIndexOf(' ', endIndex);
      
      // Prefer breaking at a newline within the last 500 characters of the chunk
      if (lastNewline > startIndex && endIndex - lastNewline < 500) {
        endIndex = lastNewline;
      } else if (lastSpace > startIndex) {
        // Fallback to space
        endIndex = lastSpace;
      }
    }

    chunks.push(text.slice(startIndex, endIndex));
    startIndex = endIndex - overlap;
  }

  return chunks;
}
