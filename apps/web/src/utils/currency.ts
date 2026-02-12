/**
 * Convert cents to formatted currency string
 * @param cents Amount in cents
 * @param showCurrency Whether to show currency symbol (default: true)
 * @returns Formatted currency string (e.g., "1 234,56 kr")
 */
export function formatCurrency(cents: number, showCurrency = true): string {
  const amount = cents / 100;
  const formatted = new Intl.NumberFormat('nb-NO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return showCurrency ? `${formatted} kr` : formatted;
}

/**
 * Convert cents to decimal amount
 * @param cents Amount in cents
 * @returns Decimal amount
 */
export function centsToAmount(cents: number): number {
  return cents / 100;
}

/**
 * Convert decimal amount to cents
 * @param amount Decimal amount
 * @returns Amount in cents
 */
export function amountToCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Parse currency string to cents
 * @param value Currency string (e.g., "1234.56" or "1,234.56")
 * @returns Amount in cents
 */
export function parseCurrency(value: string): number {
  // Remove all non-numeric characters except decimal point and comma
  const cleaned = value.replace(/[^\d,.-]/g, '');
  // Replace comma with period for parsing
  const normalized = cleaned.replace(',', '.');
  const amount = parseFloat(normalized);

  if (isNaN(amount)) {
    return 0;
  }

  return amountToCents(amount);
}
