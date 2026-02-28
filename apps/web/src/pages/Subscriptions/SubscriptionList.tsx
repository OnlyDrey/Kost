import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Power, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  useSubscriptions, useToggleSubscription, useDeleteSubscription, useGenerateSubscriptionInvoices,
  useCurrentPeriod, useCurrency, useCurrencyFormatter,
} from '../../hooks/useApi';
import { Subscription } from '../../services/api';
import { formatDate } from '../../utils/date';
import { useSettings } from '../../stores/settings.context';
import ExpenseItemCard from '../../components/Expense/ExpenseItemCard';
import ActionIconBar from '../../components/Common/ActionIconBar';
import { distributionLabel } from '../../utils/distribution';

export default function SubscriptionList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: subscriptions = [], isLoading } = useSubscriptions();
  const { settings } = useSettings();
  const { data: currentPeriod } = useCurrentPeriod();
  const { data: currency = 'NOK' } = useCurrency();
  const fmt = useCurrencyFormatter();

  const toggleSub = useToggleSubscription();
  const deleteSub = useDeleteSubscription();
  const generateInvoices = useGenerateSubscriptionInvoices();

  const [generateResult, setGenerateResult] = React.useState('');
  const [generateError, setGenerateError] = React.useState('');

  const handleGenerate = async () => {
    if (!currentPeriod) return;
    setGenerateResult('');
    setGenerateError('');
    try {
      const result = await generateInvoices.mutateAsync(currentPeriod.id);
      setGenerateResult(result.message);
    } catch (err: any) {
      setGenerateError(err?.response?.data?.message || t('subscription.generateError'));
    }
  };

  const active = subscriptions.filter(s => s.active);
  const inactive = subscriptions.filter(s => !s.active);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('subscription.title')}</h1>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {currentPeriod && (
              <button
                onClick={handleGenerate}
                disabled={generateInvoices.isPending}
                className="hidden sm:flex items-center gap-2 border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {generateInvoices.isPending
                  ? <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  : <RefreshCw size={15} />}
                {t('subscription.generate', { period: currentPeriod.id })}
              </button>
            )}
            <button
              onClick={() => navigate('/subscriptions/add')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              <Plus size={16} />
              {t('subscription.addRecurringExpense')}
            </button>
          </div>
        </div>
        {currentPeriod && (
          <button
            onClick={handleGenerate}
            disabled={generateInvoices.isPending}
            className="sm:hidden w-full flex items-center justify-center gap-2 border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {generateInvoices.isPending
              ? <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              : <RefreshCw size={15} />}
            {t('subscription.generate', { period: currentPeriod.id })}
          </button>
        )}
      </div>

      {generateResult && (
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg px-4 py-3 text-sm">
          <CheckCircle2 size={15} className="flex-shrink-0" /><span>{generateResult}</span>
        </div>
      )}
      {generateError && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
          <AlertCircle size={15} className="flex-shrink-0" /><span>{generateError}</span>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('subscription.activeSection', { count: active.length })}</h2>
        {active.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('subscription.noActive')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6 gap-3">
            {active.map(sub => (
              <SubscriptionCard
                key={sub.id}
                sub={sub}
                currency={currency}
                locale={settings.locale}
                onEdit={() => navigate(`/subscriptions/${sub.id}/edit`)}
                onToggle={() => toggleSub.mutate(sub.id)}
                onDelete={() => deleteSub.mutate(sub.id)}
                deleteConfirmMessage={t('subscription.confirmDelete', { name: sub.name })}
              />
            ))}
          </div>
        )}
      </div>

      {inactive.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('subscription.inactiveSection', { count: inactive.length })}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6 gap-3">
            {inactive.map(sub => (
              <SubscriptionCard
                key={sub.id}
                sub={sub}
                currency={currency}
                locale={settings.locale}
                onEdit={() => navigate(`/subscriptions/${sub.id}/edit`)}
                onToggle={() => toggleSub.mutate(sub.id)}
                onDelete={() => deleteSub.mutate(sub.id)}
                deleteConfirmMessage={t('subscription.confirmDelete', { name: sub.name })}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SubscriptionCard({
  sub,
  currency: _currency,
  locale,
  onEdit,
  onToggle,
  onDelete,
  deleteConfirmMessage,
}: {
  sub: Subscription;
  currency: string;
  locale: string;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  deleteConfirmMessage: string;
}) {
  const { t } = useTranslation();
  const fmt = useCurrencyFormatter();

  const freqLabel = (value: string) => {
    if (value === 'MONTHLY') return t('subscription.monthly');
    if (value === 'QUARTERLY') return t('subscription.quarterly');
    if (value === 'YEARLY') return t('subscription.yearly');
    if (value === 'CUSTOM' || !['MONTHLY', 'QUARTERLY', 'YEARLY'].includes(value)) return value;
    return value;
  };

  const methodLabel = distributionLabel(sub.distributionMethod, locale, sub.distributionRules as any);
  const statusClassName = sub.status === 'ACTIVE'
    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
    : sub.status === 'PAUSED'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
  const statusLabel = sub.status === 'ACTIVE'
    ? t('subscription.statusActive')
    : sub.status === 'PAUSED'
      ? t('subscription.statusPaused')
      : t('subscription.statusCanceled');
  const toggleLabel = sub.active ? t('subscription.deactivate') : t('subscription.activate');

  return (
    <ExpenseItemCard
      vendor={sub.vendor}
      description={sub.description ?? sub.name}
      typeLabel={methodLabel}
      category={sub.category}
      amountLabel={fmt(sub.amountCents)}
      rightContent={
        (sub.nextBillingAt || sub.lastGenerated) ? (
          <div className="flex flex-col items-end gap-1 text-xs text-gray-500 dark:text-gray-400">
            {sub.nextBillingAt && <span>{t('subscription.nextBillingShort', { date: formatDate(sub.nextBillingAt) })}</span>}
            {sub.lastGenerated && <span>{t('subscription.lastGenerated', { date: formatDate(sub.lastGenerated) })}</span>}
          </div>
        ) : undefined
      }
      actionButton={
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex items-center flex-wrap gap-1.5">
            <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full ${statusClassName}`}>
              {statusLabel}
            </span>
            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
              {freqLabel(sub.frequency)}
            </span>
          </div>
          <ActionIconBar
            items={[
              {
                key: 'edit',
                icon: Pencil,
                label: t('common.edit'),
                onClick: onEdit,
                colorClassName:
                  'bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400',
              },
              {
                key: 'toggle',
                icon: Power,
                label: toggleLabel,
                onClick: onToggle,
                colorClassName: sub.active
                  ? 'bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400'
                  : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500',
              },
              {
                key: 'delete',
                icon: Trash2,
                label: t('common.delete'),
                onClick: onDelete,
                destructive: true,
                confirmMessage: deleteConfirmMessage,
                colorClassName:
                  'bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400',
              },
            ]}
          />
        </div>
      }
    />
  );
}
