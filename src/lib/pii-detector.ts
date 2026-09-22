export interface PiiMatch {
  type: 'Credit Card' | 'SSN' | 'National ID' | 'Email' | 'Phone Number';
  value: string;
}

// Simple Luhn check for Credit Cards
function luhnCheck(cardNo: string): boolean {
  const digits = cardNo.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let isEven = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
}

export function detectPII(text: string): PiiMatch[] {
  const matches: PiiMatch[] = [];

  // Credit Card Regex (matches 13-19 digits, allowing spaces/dashes)
  const ccRegex = /(?:(?:\d[ -]*){13,19})/g;
  let match;
  while ((match = ccRegex.exec(text)) !== null) {
    if (luhnCheck(match[0])) {
      matches.push({ type: 'Credit Card', value: match[0].trim() });
    }
  }

  // SSN Regex (AAA-GG-SSSS or AAA GG SSSS)
  const ssnRegex = /\b(?!000|666|9\d{2})[0-8]\d{2}[ -]?(?!00)\d{2}[ -]?(?!0000)\d{4}\b/g;
  while ((match = ssnRegex.exec(text)) !== null) {
    // Avoid double counting if it overlaps with a CC (unlikely, but just in case)
    matches.push({ type: 'SSN', value: match[0].trim() });
  }

  // Email Regex
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  while ((match = emailRegex.exec(text)) !== null) {
    matches.push({ type: 'Email', value: match[0].trim() });
  }

  // Phone Number Regex (US/International standard shapes)
  const phoneRegex = /(?:(?:\+?1[-. ]?)?\(?[0-9]{3}\)?[-. ]?[0-9]{3}[-. ]?[0-9]{4})/g;
  while ((match = phoneRegex.exec(text)) !== null) {
    // If it looks like an SSN, it might be caught by both.
    matches.push({ type: 'Phone Number', value: match[0].trim() });
  }

  // Generic National ID / Driver's License shaped number (e.g. 8-12 alphanumeric characters with dashes)
  // This is highly prone to false positives, so we keep it strict to distinct patterns.
  const nationalIdRegex = /\b[A-Z0-9]{3,4}-[A-Z0-9]{4,6}-[A-Z0-9]{2,4}\b/g;
  while ((match = nationalIdRegex.exec(text)) !== null) {
    matches.push({ type: 'National ID', value: match[0].trim() });
  }

  // Deduplicate matches based on value
  const uniqueMatches = Array.from(new Map(matches.map(m => [m.value, m])).values());
  return uniqueMatches;
}
