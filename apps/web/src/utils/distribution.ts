type DistributionMethod = 'BY_INCOME' | 'BY_PERCENT' | 'FIXED';

const labels: Record<DistributionMethod, { en: string; nb: string }> = {
  BY_INCOME: { en: 'Income-Based', nb: 'Inntektsbasert' },
  BY_PERCENT: { en: 'Custom %', nb: 'Tilpasset %' },
  FIXED: { en: 'Fixed Amount', nb: 'Fast beløp' },
};

export function distributionLabel(method: string, locale: string = 'nb'): string {
  const entry = labels[method as DistributionMethod];
  if (!entry) return method;
  return locale === 'en' ? entry.en : entry.nb;
}
