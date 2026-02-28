import { Invoice } from '../../services/api';
import { useCurrencyFormatter } from '../../hooks/useApi';
import { useTranslation } from 'react-i18next';

interface AllocationExplanationProps {
  invoice: Invoice;
}

export default function AllocationExplanation({ invoice }: AllocationExplanationProps) {
  const { t } = useTranslation();
  const fmt = useCurrencyFormatter();

  const renderShareRows = () => {
    if (!invoice.shares || invoice.shares.length === 0) return null;

    return (
      <div className="mt-2 space-y-1">
        {invoice.shares.map((share) => (
          <p key={share.id} className="text-xs text-gray-600 dark:text-gray-400">
            {share.user?.name}: {invoice.totalCents > 0 ? ((share.shareCents / invoice.totalCents) * 100).toFixed(1) : '0'}% = {fmt(share.shareCents)}
          </p>
        ))}
      </div>
    );
  };

  const renderExplanation = () => {
    switch (invoice.distributionMethod) {
      case 'BY_INCOME':
        return (
          <div className="space-y-2 text-sm">
            <p className="text-gray-500 dark:text-gray-400">{t('invoice.incomeBased')}</p>
            <p className="text-gray-700 dark:text-gray-300">{t('invoice.allocationIncomeDescription')}</p>
            <hr className="border-gray-200 dark:border-gray-700" />
            <p className="text-gray-700 dark:text-gray-300">{t('invoice.totalLabel')} {fmt(invoice.totalCents)}</p>
            {renderShareRows()}
          </div>
        );
      case 'BY_PERCENT':
        return (
          <div className="space-y-2 text-sm">
            <p className="text-gray-500 dark:text-gray-400">{t('invoice.custom')}</p>
            <p className="text-gray-700 dark:text-gray-300">{t('invoice.allocationPercentDescription')}</p>
            <hr className="border-gray-200 dark:border-gray-700" />
            <p className="text-gray-700 dark:text-gray-300">{t('invoice.totalLabel')} {fmt(invoice.totalCents)}</p>
            {renderShareRows()}
          </div>
        );
      case 'FIXED':
        return (
          <div className="space-y-2 text-sm">
            <p className="text-gray-500 dark:text-gray-400">{t('invoice.equal')}</p>
            <p className="text-gray-700 dark:text-gray-300">{t('invoice.allocationFixedDescription')}</p>
            <hr className="border-gray-200 dark:border-gray-700" />
            <p className="text-gray-700 dark:text-gray-300">{t('invoice.totalLabel')} {fmt(invoice.totalCents)}</p>
          </div>
        );
      default:
        return <p className="text-sm text-gray-500 dark:text-gray-400">{t('invoice.unknownDistributionMethod')}</p>;
    }
  };

  return <div>{renderExplanation()}</div>;
}
