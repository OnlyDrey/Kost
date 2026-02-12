import { Typography, TypographyProps } from '@mui/material';
import { formatCurrency } from '../../utils/currency';

interface CurrencyDisplayProps extends TypographyProps {
  cents: number;
  showCurrency?: boolean;
}

export default function CurrencyDisplay({
  cents,
  showCurrency = true,
  ...typographyProps
}: CurrencyDisplayProps) {
  return (
    <Typography {...typographyProps}>
      {formatCurrency(cents, showCurrency)}
    </Typography>
  );
}
