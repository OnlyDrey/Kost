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
      case 'EQUAL': {
        const shareCount = invoice.shares?.length || 1;
        const equalShare = Math.floor(invoice.totalAmountCents / shareCount);
        return (
          <div className="space-y-2 text-sm">
            <p className="text-gray-500 dark:text-gray-400">{t('invoice.equal')}</p>
            <p className="text-gray-700 dark:text-gray-300">Total: {formatCurrency(invoice.totalAmountCents)}</p>
            <p className="text-gray-700 dark:text-gray-300">Divided by: {shareCount} {shareCount === 1 ? 'person' : 'people'}</p>
            <hr className="border-gray-200 dark:border-gray-700" />
            <p className="font-semibold text-gray-900 dark:text-gray-100">Per person: {formatCurrency(equalShare)}</p>
          </div>
        );
      }
      case 'CUSTOM':
        return (
          <div className="space-y-2 text-sm">
            <p className="text-gray-500 dark:text-gray-400">{t('invoice.custom')}</p>
            <p className="text-gray-700 dark:text-gray-300">Custom shares assigned to each person based on specific amounts.</p>
            <hr className="border-gray-200 dark:border-gray-700" />
            <p className="text-gray-700 dark:text-gray-300">Total: {formatCurrency(invoice.totalAmountCents)}</p>
          </div>
        );
      case 'INCOME_BASED':
        return (
          <div className="space-y-2 text-sm">
            <p className="text-gray-500 dark:text-gray-400">{t('invoice.incomeBased')}</p>
            <p className="text-gray-700 dark:text-gray-300">Shares calculated proportionally based on each person's income.</p>
            <hr className="border-gray-200 dark:border-gray-700" />
            <p className="text-gray-700 dark:text-gray-300">Total: {formatCurrency(invoice.totalAmountCents)}</p>
            {invoice.shares && invoice.shares.length > 0 && (
              <div className="mt-2 space-y-1">
                {invoice.shares.map((share) => (
                  <p key={share.id} className="text-xs text-gray-600 dark:text-gray-400">
                    {share.user?.name}: {share.percentageShare.toFixed(1)}% = {formatCurrency(share.shareCents)}
                  </p>
                ))}
              </div>
            )}
          </div>
        );
      default:
        return <p className="text-sm text-gray-500 dark:text-gray-400">Unknown distribution method</p>;
    }
  };

  return <div>{renderExplanation()}</div>;
}
