import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCreateInvoice, useUpdateInvoice, useCurrentPeriod, useUsers, useInvoice, useUserIncomes } from '../../hooks/useApi';
import { amountToCents, centsToAmount } from '../../utils/currency';

const inputCls =
  'w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm';

const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

export default function AddInvoice() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id && !['add'].includes(id);

  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const { data: currentPeriod } = useCurrentPeriod();
  const { data: users } = useUsers();
  const { data: existingInvoice } = useInvoice(isEditing ? id! : '');
  const { data: periodIncomes } = useUserIncomes(currentPeriod?.id ?? '');

  const [vendor, setVendor] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [distributionMethod, setDistributionMethod] = useState<'BY_INCOME' | 'BY_PERCENT' | 'FIXED'>('BY_INCOME');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [userPercents, setUserPercents] = useState<Record<string, string>>({});
  const [incomeUserIds, setIncomeUserIds] = useState<Set<string>>(new Set());

  // Default: exclude JUNIOR users from BY_INCOME selection
  useEffect(() => {
    if (users && users.length > 0 && !isEditing) {
      setIncomeUserIds(new Set(users.filter(u => u.role !== 'JUNIOR').map(u => u.id)));
    }
  }, [users?.length, isEditing]);

  // Pre-fill form when editing
  useEffect(() => {
    if (isEditing && existingInvoice) {
      setVendor(existingInvoice.vendor);
      setDescription(existingInvoice.description ?? '');
      setCategory(existingInvoice.category);
      setAmount(String(centsToAmount(existingInvoice.totalCents)));
      setDistributionMethod(existingInvoice.distributionMethod);
      if (existingInvoice.dueDate) setDueDate(existingInvoice.dueDate.slice(0, 10));
    }
  }, [isEditing, existingInvoice]);

  const totalPercent = Object.values(userPercents).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);

  // Calculate income percentages for BY_INCOME display
  const activeIncomes = periodIncomes
    ? (incomeUserIds.size === 0
        ? periodIncomes
        : periodIncomes.filter(i => incomeUserIds.has(i.userId))
      ).filter(i => i.normalizedMonthlyGrossCents > 0)
    : [];
  const totalIncome = activeIncomes.reduce((sum, i) => sum + i.normalizedMonthlyGrossCents, 0);
  const incomePercent = (userId: string) => {
    const inc = activeIncomes.find(i => i.userId === userId);
    if (!inc || totalIncome === 0) return null;
    return ((inc.normalizedMonthlyGrossCents / totalIncome) * 100).toFixed(1);
  };

  const handleToggleIncomeUser = (userId: string) => {
    setIncomeUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) { next.delete(userId); } else { next.add(userId); }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isEditing && !currentPeriod) { setError('No active period found'); return; }
    if (!vendor.trim()) { setError(t('validation.required')); return; }
    if (!category.trim()) { setError(t('validation.required')); return; }

    const totalCents = amountToCents(parseFloat(amount));
    if (isNaN(totalCents) || totalCents <= 0) { setError(t('validation.invalidAmount')); return; }

    let distributionRules: { percentRules?: Array<{userId:string;percentBasisPoints:number}>; userIds?: string[] } | undefined;

    if (distributionMethod === 'BY_PERCENT') {
      if (Math.abs(totalPercent - 100) > 0.01) { setError('Percentages must sum to 100%'); return; }
      const percentRules = Object.entries(userPercents)
        .filter(([, v]) => parseFloat(v) > 0)
        .map(([userId, v]) => ({ userId, percentBasisPoints: Math.round(parseFloat(v) * 100) }));
      if (percentRules.length === 0) { setError('Specify at least one user percentage'); return; }
      distributionRules = { percentRules };
    }

    if (distributionMethod === 'BY_INCOME' && incomeUserIds.size > 0 && users && incomeUserIds.size < users.length) {
      distributionRules = { userIds: Array.from(incomeUserIds) };
    }

    try {
      if (isEditing) {
        await updateInvoice.mutateAsync({
          id: id!,
          data: { vendor: vendor.trim(), category: category.trim(), description: description.trim() || undefined, totalCents, distributionMethod, dueDate: dueDate || undefined },
        });
      } else {
        await createInvoice.mutateAsync({
          periodId: currentPeriod!.id,
          vendor: vendor.trim(),
          category: category.trim(),
          description: description.trim() || undefined,
          totalCents,
          distributionMethod,
          dueDate: dueDate || undefined,
          distributionRules,
        });
      }
      navigate('/invoices');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || t('errors.serverError'));
    }
  };

  const isPending = createInvoice.isPending || updateInvoice.isPending;

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/invoices')} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {isEditing ? t('invoice.editInvoice') : t('invoice.addInvoice')}
        </h1>
      </div>

      {!isEditing && !currentPeriod && (
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-lg px-4 py-3 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>No active period. Please create a period first.</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Vendor *</label>
              <input type="text" value={vendor} onChange={(e) => setVendor(e.target.value)} required className={inputCls} placeholder="e.g., Electric Company" />
            </div>
            <div>
              <label className={labelCls}>{t('invoice.category')} *</label>
              <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} required className={inputCls} placeholder="e.g., Utilities" />
            </div>
          </div>

          <div>
            <label className={labelCls}>{t('invoice.description')}</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} placeholder="e.g., January electricity bill" />
          </div>

          <div>
            <label className={labelCls}>{t('invoice.amount')} *</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required step="0.01" min="0" className={inputCls} placeholder="0.00" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Amount in kr</p>
          </div>

          <div>
            <label className={labelCls}>{t('invoice.dueDate')}</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>{t('invoice.distributionMethod')} *</label>
            <select value={distributionMethod} onChange={(e) => setDistributionMethod(e.target.value as 'BY_INCOME' | 'BY_PERCENT' | 'FIXED')} className={inputCls}>
              <option value="BY_INCOME">{t('invoice.incomeBased')}</option>
              <option value="BY_PERCENT">{t('invoice.custom')}</option>
              <option value="FIXED">{t('invoice.equal')}</option>
            </select>
          </div>

          {/* BY_INCOME: user selection with income percentages */}
          {distributionMethod === 'BY_INCOME' && users && users.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={labelCls + ' mb-0'}>Velg brukere som inkluderes</label>
                {totalIncome === 0 && (
                  <span className="text-xs text-amber-600 dark:text-amber-400">Ingen inntekt registrert</span>
                )}
              </div>
              <div className="space-y-2">
                {users.map((u) => {
                  const checked = incomeUserIds.has(u.id);
                  const isJunior = u.role === 'JUNIOR';
                  const pct = incomePercent(u.id);
                  const hasIncome = activeIncomes.some(i => i.userId === u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleToggleIncomeUser(u.id)}
                      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-colors text-left ${
                        checked
                          ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${checked ? 'bg-indigo-600' : 'bg-gray-400'}`}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="flex-1 text-sm text-gray-900 dark:text-gray-100">{u.name}</span>
                      {isJunior && (
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex-shrink-0">Barn</span>
                      )}
                      {checked && pct !== null ? (
                        <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex-shrink-0">{pct}%</span>
                      ) : checked && !hasIncome ? (
                        <span className="text-xs text-amber-500 flex-shrink-0">ingen inntekt</span>
                      ) : null}
                      <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${checked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-400'}`}>
                        {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* BY_PERCENT: user percentage inputs */}
          {distributionMethod === 'BY_PERCENT' && users && users.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={labelCls + ' mb-0'}>Prosentandel per bruker *</label>
                <span className={`text-sm font-medium ${Math.abs(totalPercent - 100) < 0.01 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                  Totalt: {totalPercent.toFixed(1)}%
                </span>
              </div>
              <div className="space-y-2">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1 text-sm text-gray-900 dark:text-gray-100">{u.name}</span>
                    {u.role === 'JUNIOR' && (
                      <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex-shrink-0">Barn</span>
                    )}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <input
                        type="number" min="0" max="100" step="0.1"
                        value={userPercents[u.id] ?? ''}
                        onChange={(e) => setUserPercents(prev => ({ ...prev, [u.id]: e.target.value }))}
                        className="w-16 px-2 py-1.5 text-sm text-right rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="0"
                      />
                      <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => navigate('/invoices')} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={isPending || (!isEditing && !currentPeriod)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg transition-colors">
              {isPending && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {t('invoice.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
