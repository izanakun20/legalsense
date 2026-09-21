/**
 * Returns a safe error message for the user, preventing raw exceptions or 
 * Zod validation dumps from reaching the UI directly.
 */
export function getUserSafeErrorMessage(error: unknown, fallback: string = "An unexpected error occurred."): string {
  if (error instanceof Error && error.message) {
    // If it's a known string like "Too many requests", let it through
    if (error.message.includes("Too many requests") || 
        error.message.includes("Payload too large") ||
        error.message.includes("no extractable text") ||
        error.message.includes("maximum allowed length") ||
        error.message.includes("No file provided")) {
      return error.message;
    }
  }
  return fallback;
}
