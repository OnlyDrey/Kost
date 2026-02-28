type DistributionMethod = 'BY_INCOME' | 'BY_PERCENT' | 'FIXED';

type DistributionRulesLike = {
  fixedRules?: Array<{ userId: string; fixedCents: number }>;
} | null | undefined;

const labels: Record<DistributionMethod, { en: string; nb: string }> = {
  BY_INCOME: { en: 'Income-Based', nb: 'Inntektsbasert fordeling' },
  BY_PERCENT: { en: 'Custom', nb: 'Egendefinert' },
  FIXED: { en: 'Equal Split', nb: 'Lik fordeling' },
};

const fixedAmountLabels = { en: 'Amount', nb: 'Beløp' };

export function distributionLabel(method: string, locale: string = 'nb', rules?: DistributionRulesLike): string {
  if (method === 'FIXED' && rules?.fixedRules && rules.fixedRules.length > 0) {
    return locale === 'en' ? fixedAmountLabels.en : fixedAmountLabels.nb;
  }

  const entry = labels[method as DistributionMethod];
  if (!entry) return method;
  return locale === 'en' ? entry.en : entry.nb;
}

export function distributionFilterMatch(method: string, filterMethod: string, rules?: DistributionRulesLike): boolean {
  if (filterMethod === 'ALL') return true;
  if (filterMethod === 'FIXED_EQUAL') return method === 'FIXED' && (!rules?.fixedRules || rules.fixedRules.length === 0);
  if (filterMethod === 'FIXED_AMOUNT') return method === 'FIXED' && !!rules?.fixedRules && rules.fixedRules.length > 0;
  return method === filterMethod;
}
