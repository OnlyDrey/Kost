import { Invoice } from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../hooks/useApi';

interface AllocationExplanationProps {
  invoice: Invoice;
}

export default function AllocationExplanation({ invoice }: AllocationExplanationProps) {
  const { t } = useTranslation();
  const { data: currency = 'NOK' } = useCurrency();

  const renderExplanation = () => {
    switch (invoice.distributionMethod) {
      case 'BY_INCOME':
        return (
          <div className="space-y-2 text-sm">
            <p className="text-gray-500 dark:text-gray-400">{t('invoice.incomeBased')}</p>
            <p className="text-gray-700 dark:text-gray-300">Shares calculated proportionally based on each person's income.</p>
            <hr className="border-gray-200 dark:border-gray-700" />
            <p className="text-gray-700 dark:text-gray-300">Total: {formatCurrency(invoice.totalCents, currency)}</p>
            {invoice.shares && invoice.shares.length > 0 && (
              <div className="mt-2 space-y-1">
                {invoice.shares.map((share) => (
                  <p key={share.id} className="text-xs text-gray-600 dark:text-gray-400">
                    {share.user?.name}: {invoice.totalCents > 0 ? ((share.shareCents / invoice.totalCents) * 100).toFixed(1) : '0'}% = {formatCurrency(share.shareCents, currency)}
                  </p>
                ))}
              </div>
            )}
          </div>
        );
      case 'BY_PERCENT':
        return (
          <div className="space-y-2 text-sm">
            <p className="text-gray-500 dark:text-gray-400">{t('invoice.custom')}</p>
            <p className="text-gray-700 dark:text-gray-300">Shares split by percentage rules.</p>
            <hr className="border-gray-200 dark:border-gray-700" />
            <p className="text-gray-700 dark:text-gray-300">Total: {formatCurrency(invoice.totalCents, currency)}</p>
            {invoice.shares && invoice.shares.length > 0 && (
              <div className="mt-2 space-y-1">
                {invoice.shares.map((share) => (
                  <p key={share.id} className="text-xs text-gray-600 dark:text-gray-400">
                    {share.user?.name}: {invoice.totalCents > 0 ? ((share.shareCents / invoice.totalCents) * 100).toFixed(1) : '0'}% = {formatCurrency(share.shareCents, currency)}
                  </p>
                ))}
              </div>
            )}
          </div>
        );
      case 'FIXED':
        return (
          <div className="space-y-2 text-sm">
            <p className="text-gray-500 dark:text-gray-400">{t('invoice.equal')}</p>
            <p className="text-gray-700 dark:text-gray-300">Fixed amounts assigned per person.</p>
            <hr className="border-gray-200 dark:border-gray-700" />
            <p className="text-gray-700 dark:text-gray-300">Total: {formatCurrency(invoice.totalCents, currency)}</p>
          </div>
        );
      default:
        return <p className="text-sm text-gray-500 dark:text-gray-400">Unknown distribution method</p>;
    }
  };

  return <div>{renderExplanation()}</div>;
}
