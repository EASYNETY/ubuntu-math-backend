/**
 * Format amount in South African Rand (ZAR) currency
 * @param amount - Amount to format
 * @returns Formatted string with R prefix, comma separators, and 2 decimal places (e.g., "R 1,200.00")
 */
export function formatZAR(amount: number): string {
  // Round to 2 decimal places
  const rounded = Math.round(amount * 100) / 100;
  
  // Format with comma separators and 2 decimal places
  const formatted = rounded.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return `R ${formatted}`;
}

/**
 * Parse ZAR formatted string back to number
 * @param formattedAmount - Formatted string (e.g., "R 1,200.00")
 * @returns Numeric amount
 */
export function parseZAR(formattedAmount: string): number {
  const numericString = formattedAmount
    .replace('R', '')
    .replace(/,/g, '')
    .trim();
  return parseFloat(numericString);
}
