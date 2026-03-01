const LOCALE_BY_APP_LANGUAGE: Record<string, string> = {
  nb: 'nb-NO',
  en: 'en-GB',
};

function resolveLocale(locale?: string): string {
  if (locale && LOCALE_BY_APP_LANGUAGE[locale]) return LOCALE_BY_APP_LANGUAGE[locale];
  if (locale) return locale;
  return 'nb-NO';
}

/**
 * Extract the narrow currency symbol for a given currency code and locale.
 * e.g. getCurrencySymbol('NOK', 'nb-NO') → 'kr'
 *      getCurrencySymbol('USD', 'en-GB')  → '$'
 */
export function getCurrencySymbol(currency: string, locale?: string): string {
  const resolvedLocale = resolveLocale(locale);
  try {
    // Format a dummy value and strip the digit, separators and whitespace
    const formatted = new Intl.NumberFormat(resolvedLocale, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(0);
    // Remove digits, separators (.,) and various whitespace/NBSP — what remains is the symbol
    const symbol = formatted.replace(/[\d\s,.\u00A0\u202F\u2009]+/g, '').trim();
    if (!symbol && currency === 'NOK') return 'kr';
    return symbol || currency;
  } catch {
    return currency === 'NOK' ? 'kr' : currency;
  }
}

/**
 * Convert cents to a formatted currency string.
 *
 * @param cents          - Amount in smallest currency unit (integer)
 * @param currency       - ISO 4217 currency code, e.g. 'NOK'
 * @param showCurrency   - Whether to include the currency symbol
 * @param locale         - App locale key ('nb' | 'en') or a BCP47 locale tag
 * @param symbolPosition - 'Before' → symbol before number (default); 'After' → symbol after number
 */
export function formatCurrency(
  cents: number,
  currency = 'NOK',
  showCurrency = true,
  locale?: string,
  symbolPosition: 'Before' | 'After' = 'Before',
): string {
  const amount = cents / 100;
  const resolvedLocale = resolveLocale(locale);

  // Plain number (no symbol)
  if (!showCurrency) {
    return new Intl.NumberFormat(resolvedLocale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  const symbol = getCurrencySymbol(currency, resolvedLocale);
  const numStr = new Intl.NumberFormat(resolvedLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  // Negative: keep the minus sign before the symbol when Before, or after number when After
  if (symbolPosition === 'After') {
    return `${numStr}\u00A0${symbol}`;
  }
  // Before (default): handle negative sign correctly
  if (amount < 0) {
    // numStr already starts with '-'; put symbol after the minus
    return `-${symbol}\u00A0${numStr.replace(/^-/, '')}`;
  }
  return `${symbol}\u00A0${numStr}`;
}

export function centsToAmount(cents: number): number {
  return cents / 100;
}

export function amountToCents(amount: number): number {
  return Math.round(amount * 100);
}

export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^\d,.-]/g, '');
  const normalized = cleaned.replace(',', '.');
  const amount = parseFloat(normalized);

  if (isNaN(amount)) {
    return 0;
  }

  return amountToCents(amount);
}
