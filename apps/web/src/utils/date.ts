/**
 * Format date string to localized format
 * @param dateString ISO date string
 * @param locale Locale code (default: 'nb-NO')
 * @returns Formatted date string
 */
export function formatDate(dateString: string, locale = 'nb-NO'): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Format date to long format
 * @param dateString ISO date string
 * @param locale Locale code (default: 'nb-NO')
 * @returns Formatted date string
 */
export function formatDateLong(dateString: string, locale = 'nb-NO'): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Format date and time
 * @param dateString ISO date string
 * @param locale Locale code (default: 'nb-NO')
 * @returns Formatted date and time string
 */
export function formatDateTime(dateString: string, locale = 'nb-NO'): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Get relative time (e.g., "2 days ago")
 * @param dateString ISO date string
 * @param locale Locale code (default: 'nb-NO')
 * @returns Relative time string
 */
export function getRelativeTime(dateString: string, locale = 'nb-NO'): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return locale === 'nb-NO' ? 'I dag' : 'Today';
  } else if (diffDays === 1) {
    return locale === 'nb-NO' ? 'I går' : 'Yesterday';
  } else if (diffDays < 7) {
    return locale === 'nb-NO' ? `${diffDays} dager siden` : `${diffDays} days ago`;
  } else {
    return formatDate(dateString, locale);
  }
}

/**
 * Convert date to ISO string (YYYY-MM-DD)
 * @param date Date object
 * @returns ISO date string
 */
export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}
