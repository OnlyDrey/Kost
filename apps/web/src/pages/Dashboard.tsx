import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Receipt, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { useCurrentPeriod, useInvoices, usePeriodStats, useCurrency } from '../hooks/useApi';
import { useAuth } from '../stores/auth.context';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';

function StatCard({
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
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
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

  const userShare = stats?.userShares?.find((share) => share.userId === user?.id);
  const isLoading = periodLoading || invoicesLoading || statsLoading;
  const { data: currency = 'NOK' } = useCurrency();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Receipt} label={t('dashboard.totalInvoices')} value={stats?.totalInvoices ?? 0} color="bg-indigo-500" />
        <StatCard icon={DollarSign} label={t('dashboard.totalAmount')} value={formatCurrency(stats?.totalAmountCents ?? 0, currency)} color="bg-emerald-500" />
        <StatCard icon={TrendingUp} label={t('dashboard.yourShare')} value={formatCurrency(userShare?.totalShareCents ?? 0, currency)} color="bg-amber-500" />
        <StatCard icon={Clock} label={t('dashboard.periodStatus')} value={currentPeriod?.status === 'OPEN' ? t('period.open') : t('period.closed')} color="bg-sky-500" />
      </div>

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
