import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Power, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  useSubscriptions, useToggleSubscription, useDeleteSubscription, useGenerateSubscriptionInvoices,
  useCurrentPeriod, useUsers, useCurrency,
} from '../../hooks/useApi';
import { formatCurrency } from '../../utils/currency';
import { Subscription } from '../../services/api';
import { formatDate } from '../../utils/date';

export default function SubscriptionList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: subscriptions = [], isLoading } = useSubscriptions();
  const { data: currentPeriod } = useCurrentPeriod();
  const { data: currency = 'NOK' } = useCurrency();

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
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('subscription.title')}</h1>
          <div className="flex items-center gap-2">
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
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              <Plus size={16} />
              {t('subscription.new')}
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

      {/* Active subscriptions */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('subscription.activeSection', { count: active.length })}</h2>
        {active.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('subscription.noActive')}</p>
          </div>
        ) : (
          active.map(sub => (
            <SubscriptionCard
              key={sub.id}
              sub={sub}
              currency={currency}
              onEdit={() => navigate(`/subscriptions/${sub.id}/edit`)}
              onToggle={() => toggleSub.mutate(sub.id)}
              onDelete={() => { if (confirm(t('subscription.confirmDelete', { name: sub.name }))) deleteSub.mutate(sub.id); }}
            />
          ))
        )}
      </div>

      {/* Inactive subscriptions */}
      {inactive.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('subscription.inactiveSection', { count: inactive.length })}</h2>
          {inactive.map(sub => (
            <SubscriptionCard
              key={sub.id}
              sub={sub}
              currency={currency}
              onEdit={() => navigate(`/subscriptions/${sub.id}/edit`)}
              onToggle={() => toggleSub.mutate(sub.id)}
              onDelete={() => { if (confirm(t('subscription.confirmDelete', { name: sub.name }))) deleteSub.mutate(sub.id); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SubscriptionCard({
  sub,
  currency,
  onEdit,
  onToggle,
  onDelete,
}: {
  sub: Subscription;
  currency: string;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const { data: users = [] } = useUsers();

  const freqLabel = (value: string) => {
    if (value === 'MONTHLY') return t('subscription.monthly');
    if (value === 'QUARTERLY') return t('subscription.quarterly');
    if (value === 'YEARLY') return t('subscription.yearly');
    if (value === 'CUSTOM' || !['MONTHLY', 'QUARTERLY', 'YEARLY'].includes(value)) return value;
    return value;
  };

  const methodLabel = sub.distributionMethod === 'BY_INCOME' ? t('invoice.incomeBased')
    : sub.distributionMethod === 'FIXED' ? t('invoice.equal') : t('subscription.customPct');

  const selectedUserIds = ((sub.distributionRules as any)?.userIds ?? []) as string[];
  const selectedUsers = users.filter(u => selectedUserIds.includes(u.id));

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border p-4 shadow-sm transition-all ${
      sub.active ? 'border-gray-200 dark:border-gray-800' : 'border-gray-100 dark:border-gray-800/50 opacity-60'
    }`}>
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 dark:text-gray-100">{sub.name}</p>
            <span className="text-xs text-gray-500 dark:text-gray-400">{sub.vendor}</span>
            {sub.category && (
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                {sub.category}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs text-indigo-600 dark:text-indigo-400">{freqLabel(sub.frequency)}</span>
            {sub.dayOfMonth && <span className="text-xs text-gray-500 dark:text-gray-400">{t('subscription.day', { day: sub.dayOfMonth })}</span>}
            <span className="text-xs text-gray-500 dark:text-gray-400">{methodLabel}</span>
            {selectedUsers.length > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {selectedUsers.map(u => u.name).join(', ')}
              </span>
            )}
            {sub.lastGenerated && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {t('subscription.lastGenerated', { date: formatDate(sub.lastGenerated) })}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            {formatCurrency(sub.amountCents, currency)}
          </p>
          <button onClick={onEdit} className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            <Pencil size={16} />
          </button>
          <button
            onClick={onToggle}
            title={sub.active ? t('subscription.deactivate') : t('subscription.activate')}
            className={`transition-colors ${sub.active ? 'text-green-600 dark:text-green-400 hover:text-gray-400' : 'text-gray-400 hover:text-green-600 dark:hover:text-green-400'}`}
          >
            <Power size={16} />
          </button>
          <button onClick={onDelete} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
