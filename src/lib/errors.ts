/**
 * Returns a safe error message for the user, preventing raw exceptions or 
 * Zod validation dumps from reaching the UI directly.
 */
export function getUserSafeErrorMessage(error: unknown, fallback: string = "An unexpected error occurred."): string {
  // If it's a known custom application error, we might return its message.
  // Otherwise, to prevent leaking stack traces or raw Zod dumps, we return the fallback.
  // For V1, we err on the side of safety.
  return fallback;
}
