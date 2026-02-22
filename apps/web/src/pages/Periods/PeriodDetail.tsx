import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Receipt, DollarSign, TrendingUp, Users, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePeriod, usePeriodStats, useInvoices, useUserIncomes, useCurrency } from '../../hooks/useApi';
import { useAuth } from '../../stores/auth.context';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';

export default function PeriodDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const { data: period, isLoading: periodLoading } = usePeriod(id!);
  const { data: stats, isLoading: statsLoading } = usePeriodStats(id!);
  const { data: invoices, isLoading: invoicesLoading } = useInvoices(id!);
  const { data: incomes, isLoading: incomesLoading } = useUserIncomes(id!);
  const isLoading = periodLoading || statsLoading || invoicesLoading;

  const getIncomeForUser = (userId: string) => incomes?.find(i => i.userId === userId);
  const { data: currency = 'NOK' } = useCurrency();

  const categoryBreakdown = useMemo(() => {
    if (!invoices || invoices.length === 0) return [];
    const map: Record<string, number> = {};
    for (const inv of invoices) {
      const cat = inv.category || '—';
      map[cat] = (map[cat] || 0) + inv.totalCents;
    }
    return Object.entries(map)
      .map(([category, totalCents]) => ({ category, totalCents }))
      .sort((a, b) => b.totalCents - a.totalCents);
  }, [invoices]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!period) {
    return <p className="text-sm text-gray-500">{t('errors.notFound')}</p>;
  }

  const userShare = stats?.userShares?.find(s => s.userId === currentUser?.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/periods')} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{period.id}</h1>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
              period.status === 'OPEN'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              {period.status === 'OPEN' ? t('period.open') : t('period.closed')}
            </span>
          </div>
          {period.closedAt && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t('period.closedAt', { date: formatDate(period.closedAt) })}</p>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Receipt, label: t('dashboard.totalInvoices'), value: stats?.totalInvoices ?? 0, color: 'bg-indigo-500' },
          { icon: DollarSign, label: t('dashboard.totalAmount'), value: formatCurrency(stats?.totalAmountCents ?? 0, currency), color: 'bg-emerald-500' },
          { icon: TrendingUp, label: t('dashboard.yourShare'), value: formatCurrency(userShare?.totalShareCents ?? 0, currency), color: 'bg-amber-500' },
          { icon: Users, label: t('period.userShares'), value: stats?.userShares?.length ?? 0, color: 'bg-sky-500' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={16} className="text-white" />
              </div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</p>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          </div>
        ))}
      </div>

      {/* User shares */}
      {stats?.userShares && stats.userShares.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('period.userShares')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.userShares.map((share) => (
              <div key={share.userId} className="border border-gray-100 dark:border-gray-800 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{share.userName}</p>
                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {formatCurrency(share.totalShareCents, currency)}
                </p>
                {stats.totalAmountCents > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {((share.totalShareCents / stats.totalAmountCents) * 100).toFixed(1)}%
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Tag size={16} className="text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">{t('period.categoryBreakdown')}</h2>
          </div>
          <div className="space-y-2">
            {categoryBreakdown.map(({ category, totalCents }) => {
              const pct = stats?.totalAmountCents ? (totalCents / stats.totalAmountCents) * 100 : 0;
              return (
                <div key={category}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{category}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{pct.toFixed(1)}%</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(totalCents, currency)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Invoices */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">{t('invoice.invoices')}</h2>
        </div>
        {!invoices || invoices.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">{t('common.noData')}</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                onClick={() => navigate(`/invoices/${invoice.id}`)}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{invoice.vendor}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {invoice.description ? `${invoice.description} · ` : ''}{invoice.category}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(invoice.totalCents, currency)}</p>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(invoice.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
