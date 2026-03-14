import { useCurrencyFormatter } from '../../hooks/useApi';

interface CurrencyDisplayProps {
  cents: number;
  showCurrency?: boolean;
  className?: string;
}

export default function CurrencyDisplay({ cents, showCurrency = true, className }: CurrencyDisplayProps) {
  const fmt = useCurrencyFormatter();
  return <span className={className}>{fmt(cents, showCurrency)}</span>;
}
