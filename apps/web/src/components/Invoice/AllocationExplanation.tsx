import { Box, Typography, Divider } from '@mui/material';
import { Invoice } from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import { useTranslation } from 'react-i18next';

interface AllocationExplanationProps {
  invoice: Invoice;
}

export default function AllocationExplanation({ invoice }: AllocationExplanationProps) {
  const { t } = useTranslation();

  const renderExplanation = () => {
    switch (invoice.distributionMethod) {
      case 'EQUAL':
        const shareCount = invoice.shares?.length || 1;
        const equalShare = Math.floor(invoice.totalAmountCents / shareCount);
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('invoice.equal')}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Total: {formatCurrency(invoice.totalAmountCents)}
            </Typography>
            <Typography variant="body2">
              Divided by: {shareCount} {shareCount === 1 ? 'person' : 'people'}
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body1" fontWeight="medium">
              Per person: {formatCurrency(equalShare)}
            </Typography>
          </Box>
        );

      case 'CUSTOM':
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('invoice.custom')}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Custom shares assigned to each person based on specific amounts.
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2">
              Total: {formatCurrency(invoice.totalAmountCents)}
            </Typography>
          </Box>
        );

      case 'INCOME_BASED':
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('invoice.incomeBased')}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Shares calculated proportionally based on each person's income for this period.
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2">
              Total: {formatCurrency(invoice.totalAmountCents)}
            </Typography>
            {invoice.shares && invoice.shares.length > 0 && (
              <Box sx={{ mt: 2 }}>
                {invoice.shares.map((share) => (
                  <Typography key={share.id} variant="caption" display="block">
                    {share.user?.name}: {share.percentageShare.toFixed(1)}% = {formatCurrency(share.shareCents)}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
        );

      default:
        return (
          <Typography variant="body2" color="text.secondary">
            Unknown distribution method
          </Typography>
        );
    }
  };

  return <Box>{renderExplanation()}</Box>;
}
