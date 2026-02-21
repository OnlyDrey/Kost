import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Receipt, DollarSign, TrendingUp, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePeriod, usePeriodStats, useInvoices, useUserIncomes, useUpsertUserIncome, useUsers } from '../../hooks/useApi';
import { useAuth } from '../../stores/auth.context';
import { formatCurrency, amountToCents, centsToAmount } from '../../utils/currency';
import { formatDate } from '../../utils/date';

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm';

const INCOME_TYPES = [
  { value: 'MONTHLY_GROSS', label: 'Månedlig brutto' },
  { value: 'MONTHLY_NET', label: 'Månedlig netto' },
  { value: 'ANNUAL_GROSS', label: 'Årlig brutto' },
  { value: 'ANNUAL_NET', label: 'Årlig netto' },
];

export default function PeriodDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const { data: period, isLoading: periodLoading } = usePeriod(id!);
  const { data: stats, isLoading: statsLoading } = usePeriodStats(id!);
  const { data: invoices, isLoading: invoicesLoading } = useInvoices(id!);
  const { data: incomes, isLoading: incomesLoading } = useUserIncomes(id!);
  const { data: users } = useUsers();
  const upsertIncome = useUpsertUserIncome();

  // Income form state: keyed by userId
  const [incomeValues, setIncomeValues] = useState<Record<string, string>>({});
  const [incomeTypes, setIncomeTypes] = useState<Record<string, string>>({});
  const [incomeSaving, setIncomeSaving] = useState<Record<string, boolean>>({});
  const [incomeSuccess, setIncomeSuccess] = useState<Record<string, boolean>>({});
  const [incomeError, setIncomeError] = useState<Record<string, string>>({});

  const isLoading = periodLoading || statsLoading || invoicesLoading || incomesLoading;

  const getIncomeForUser = (userId: string) => incomes?.find(i => i.userId === userId);

  const getDisplayAmount = (userId: string) => {
    if (incomeValues[userId] !== undefined) return incomeValues[userId];
    const existing = getIncomeForUser(userId);
    return existing ? String(centsToAmount(existing.inputCents)) : '';
  };

  const getDisplayType = (userId: string) => {
    if (incomeTypes[userId] !== undefined) return incomeTypes[userId];
    const existing = getIncomeForUser(userId);
    return existing?.inputType || 'MONTHLY_GROSS';
  };

  const handleSaveIncome = async (userId: string) => {
    const rawAmount = incomeValues[userId] ?? String(centsToAmount(getIncomeForUser(userId)?.inputCents ?? 0));
    const inputType = getDisplayType(userId);
    const inputCents = amountToCents(parseFloat(rawAmount));

    if (isNaN(inputCents) || inputCents <= 0) {
      setIncomeError(prev => ({ ...prev, [userId]: t('validation.invalidAmount') }));
      return;
    }

    setIncomeSaving(prev => ({ ...prev, [userId]: true }));
    setIncomeError(prev => ({ ...prev, [userId]: '' }));

    try {
      await upsertIncome.mutateAsync({ userId, periodId: id!, inputType, inputCents });
      setIncomeSuccess(prev => ({ ...prev, [userId]: true }));
      setTimeout(() => setIncomeSuccess(prev => ({ ...prev, [userId]: false })), 2000);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setIncomeError(prev => ({ ...prev, [userId]: Array.isArray(msg) ? msg.join(', ') : msg || t('errors.serverError') }));
    } finally {
      setIncomeSaving(prev => ({ ...prev, [userId]: false }));
    }
  };

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
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Lukket: {formatDate(period.closedAt)}</p>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Receipt, label: t('dashboard.totalInvoices'), value: stats?.totalInvoices ?? 0, color: 'bg-indigo-500' },
          { icon: DollarSign, label: t('dashboard.totalAmount'), value: formatCurrency(stats?.totalAmountCents ?? 0), color: 'bg-emerald-500' },
          { icon: TrendingUp, label: t('dashboard.yourShare'), value: formatCurrency(userShare?.totalShareCents ?? 0), color: 'bg-amber-500' },
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
                  {formatCurrency(share.totalShareCents)}
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

      {/* Income registration */}
      {users && users.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Inntektsregistrering</h2>
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{u.name}</p>
                    {getIncomeForUser(u.id) && (
                      <p className="text-xs text-gray-400">
                        Registrert: {formatCurrency(getIncomeForUser(u.id)!.normalizedMonthlyGrossCents)}/mnd
                      </p>
                    )}
                  </div>
                  {incomeSuccess[u.id] && <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />}
                </div>
                {incomeError[u.id] && (
                  <div className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs mb-2">
                    <AlertCircle size={13} /> <span>{incomeError[u.id]}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Beløp (kr)</label>
                    <input
                      type="number"
                      step="100"
                      min="0"
                      value={getDisplayAmount(u.id)}
                      onChange={(e) => setIncomeValues(prev => ({ ...prev, [u.id]: e.target.value }))}
                      className={inputCls}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Type</label>
                    <select
                      value={getDisplayType(u.id)}
                      onChange={(e) => setIncomeTypes(prev => ({ ...prev, [u.id]: e.target.value }))}
                      className={inputCls}
                    >
                      {INCOME_TYPES.map(it => (
                        <option key={it.value} value={it.value}>{it.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => handleSaveIncome(u.id)}
                    disabled={incomeSaving[u.id]}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {incomeSaving[u.id] && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    Lagre
                  </button>
                </div>
              </div>
            ))}
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
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(invoice.totalCents)}</p>
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
