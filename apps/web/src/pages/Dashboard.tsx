import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Receipt, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { useCurrentPeriod, useInvoices, usePeriodStats, useCurrency } from '../hooks/useApi';
import { useAuth } from '../stores/auth.context';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';

function MoneyStatCard({
  icon: Icon,
  label,
  cents,
  currency,
  color,
}: {
  icon: React.ElementType;
  label: string;
  cents: number;
  currency: string;
  color: string;
}) {
  const formatted = formatCurrency(cents, currency);
  const textSize = formatted.length > 11 ? 'text-lg' : formatted.length > 8 ? 'text-xl' : 'text-2xl';
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
      </div>
      <p className={`${textSize} font-bold text-gray-900 dark:text-gray-100 break-all`}>{formatted}</p>
    </div>
  );
}

function SmallStatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-3.5 shadow-sm flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={16} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-base font-bold text-gray-900 dark:text-gray-100">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: currentPeriod, isLoading: periodLoading } = useCurrentPeriod();
  const { data: invoices, isLoading: invoicesLoading } = useInvoices(currentPeriod?.id);
  const { data: stats, isLoading: statsLoading } = usePeriodStats(currentPeriod?.id || '');
  const { data: currency = 'NOK' } = useCurrency();

  const userShare = stats?.userShares?.find((share) => share.userId === user?.id);
  const isLoading = periodLoading || invoicesLoading || statsLoading;

  const categoryBreakdown = useMemo(() => {
    if (!invoices || !user) return [];
    const map: Record<string, number> = {};
    for (const invoice of invoices) {
      const myShare = invoice.shares?.find((s) => s.userId === user.id);
      if (!myShare) continue;
      const cat = invoice.category || 'Annet';
      map[cat] = (map[cat] ?? 0) + myShare.shareCents;
    }
    return Object.entries(map)
      .map(([category, totalCents]) => ({ category, totalCents }))
      .sort((a, b) => b.totalCents - a.totalCents);
  }, [invoices, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const userTotalCents = userShare?.totalShareCents ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('dashboard.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('dashboard.currentPeriod')}: <span className="font-medium">{currentPeriod?.id || t('common.noData')}</span>
          {currentPeriod && (
            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              currentPeriod.status === 'OPEN'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              {currentPeriod.status === 'OPEN' ? t('period.open') : t('period.closed')}
            </span>
          )}
        </p>
      </div>

      {/* Main money cards – your share first, total second */}
      <div className="grid grid-cols-2 gap-4">
        <MoneyStatCard icon={TrendingUp} label={t('dashboard.yourShare')} cents={userTotalCents} currency={currency} color="bg-amber-500" />
        <MoneyStatCard icon={DollarSign} label={t('dashboard.totalAmount')} cents={stats?.totalAmountCents ?? 0} currency={currency} color="bg-emerald-500" />
      </div>

      {/* Smaller info cards */}
      <div className="grid grid-cols-2 gap-4">
        <SmallStatCard icon={Receipt} label={t('dashboard.totalInvoices')} value={stats?.totalInvoices ?? 0} color="bg-indigo-500" />
        <SmallStatCard
          icon={Clock}
          label={t('dashboard.periodStatus')}
          value={currentPeriod?.status === 'OPEN' ? t('period.open') : t('period.closed')}
          color="bg-sky-500"
        />
      </div>

      {/* Category breakdown for current user */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">{t('dashboard.categoryBreakdown')}</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {categoryBreakdown.map(({ category, totalCents }) => {
              const pct = userTotalCents > 0 ? (totalCents / userTotalCents) * 100 : 0;
              return (
                <div key={category} className="px-5 py-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{category}</span>
                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{formatCurrency(totalCents, currency)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${Math.min(pct, 100).toFixed(1)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{pct.toFixed(1)}% {t('dashboard.percentOfShare')}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent invoices */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">{t('dashboard.recentInvoices')}</h2>
          <button
            onClick={() => navigate('/invoices')}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            {t('dashboard.viewAll')}
          </button>
        </div>

        {!invoices || invoices.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">{t('common.noData')}</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {invoices.slice(0, 5).map((invoice) => (
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
