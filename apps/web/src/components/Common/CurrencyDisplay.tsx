import { formatCurrency } from '../../utils/currency';
import { useCurrency } from '../../hooks/useApi';

interface CurrencyDisplayProps {
  cents: number;
  showCurrency?: boolean;
  className?: string;
}

export default function CurrencyDisplay({ cents, showCurrency = true, className }: CurrencyDisplayProps) {
  const { data: currency = 'NOK' } = useCurrency();
  return <span className={className}>{formatCurrency(cents, currency, showCurrency)}</span>;
}
