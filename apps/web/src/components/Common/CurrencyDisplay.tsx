import { formatCurrency } from '../../utils/currency';

interface CurrencyDisplayProps {
  cents: number;
  showCurrency?: boolean;
  className?: string;
}

export default function CurrencyDisplay({ cents, showCurrency = true, className }: CurrencyDisplayProps) {
  return <span className={className}>{formatCurrency(cents, showCurrency)}</span>;
}
