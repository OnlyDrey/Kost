import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  useCreateInvoice, useUpdateInvoice, useCreateSubscription, useUpdateSubscription,
  useCurrentPeriod, useUsers, useInvoice, useSubscription,
  useUserIncomes, useCategories, usePaymentMethods, useVendors, useCurrency
} from '../../hooks/useApi';
import { amountToCents, centsToAmount } from '../../utils/currency';

const inputCls =
  'w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm';

const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

export default function AddExpense() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();

  // Determine type from URL pathname
  const isSubscription = location.pathname.includes('/subscriptions/');
  const isEditing = !!id && !['add'].includes(id);

  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const createSubscription = useCreateSubscription();
  const updateSubscription = useUpdateSubscription();

  const { data: currentPeriod } = useCurrentPeriod();
  const { data: users } = useUsers();
  const { data: existingInvoice } = useInvoice(isEditing && !isSubscription ? id! : '');
  const { data: existingSubscription } = useSubscription(isEditing && isSubscription ? id! : '');
  const { data: periodIncomes } = useUserIncomes(currentPeriod?.id ?? '');
  const { data: categories = [] } = useCategories();
  const { data: paymentMethods = [] } = usePaymentMethods();
  const { data: vendors = [] } = useVendors();
  const { data: currency = 'NOK' } = useCurrency();

  const [vendor, setVendor] = useState('');
  const [showVendorList, setShowVendorList] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [distributionMethod, setDistributionMethod] = useState<'BY_INCOME' | 'BY_PERCENT' | 'FIXED'>('BY_INCOME');
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [frequency, setFrequency] = useState('MONTHLY');
  const [frequencyQuantity, setFrequencyQuantity] = useState('1');
  const [frequencyUnit, setFrequencyUnit] = useState('MONTH');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [active, setActive] = useState(true);
  const [error, setError] = useState('');
  const [userPercents, setUserPercents] = useState<Record<string, string>>({});
  const [incomeUserIds, setIncomeUserIds] = useState<Set<string>>(new Set());

  // Default: exclude JUNIOR users from BY_INCOME selection
  useEffect(() => {
    if (users && users.length > 0 && !isEditing) {
      setIncomeUserIds(new Set(users.filter(u => u.role !== 'JUNIOR').map(u => u.id)));
    }
  }, [users, isEditing]);

  // Pre-fill form when editing invoice
  useEffect(() => {
    if (isEditing && !isSubscription && existingInvoice) {
      setVendor(existingInvoice.vendor);
      setDescription(existingInvoice.description ?? '');
      setCategory(existingInvoice.category);
      setAmount(String(centsToAmount(existingInvoice.totalCents)));
      setDistributionMethod(existingInvoice.distributionMethod);
      setPaymentMethod(existingInvoice.paymentMethod ?? '');
      if (existingInvoice.dueDate) setDueDate(existingInvoice.dueDate.slice(0, 10));
      // Initialize selected users from existing shares
      if (existingInvoice.shares && existingInvoice.shares.length > 0) {
        setIncomeUserIds(new Set(existingInvoice.shares.map((s: any) => s.userId)));
        // For BY_PERCENT, populate userPercents from shares
        if (existingInvoice.distributionMethod === 'BY_PERCENT') {
          const percents: Record<string, string> = {};
          existingInvoice.shares.forEach((share: any) => {
            if (existingInvoice.totalCents > 0) {
              const percentage = ((share.shareCents / existingInvoice.totalCents) * 100).toFixed(1);
              percents[share.userId] = percentage;
            }
          });
          setUserPercents(percents);
        }
      }
    }
  }, [isEditing, existingInvoice?.id, isSubscription]);

  // Parse frequency string into quantity and unit
  const parseFrequency = (freq: string) => {
    const match = freq.match(/^(\d+)_(\w+)$/);
    if (match) {
      return { quantity: match[1], unit: match[2] };
    }
    // Handle standard frequencies
    if (freq === 'DAILY') return { quantity: '1', unit: 'DAY' };
    if (freq === 'WEEKLY') return { quantity: '1', unit: 'WEEK' };
    if (freq === 'MONTHLY') return { quantity: '1', unit: 'MONTH' };
    if (freq === 'QUARTERLY') return { quantity: '3', unit: 'MONTH' };
    if (freq === 'YEARLY') return { quantity: '1', unit: 'YEAR' };
    return { quantity: '1', unit: 'MONTH' };
  };

  // Calculate frequency string from quantity and unit
  const calculateFrequency = (quantity: string, unit: string) => {
    const q = parseInt(quantity) || 1;
    if (q === 1 && unit === 'DAY') return 'DAILY';
    if (q === 1 && unit === 'WEEK') return 'WEEKLY';
    if (q === 1 && unit === 'MONTH') return 'MONTHLY';
    if (q === 3 && unit === 'MONTH') return 'QUARTERLY';
    if (q === 1 && unit === 'YEAR') return 'YEARLY';
    return `${q}_${unit}`;
  };

  // Pre-fill form when editing subscription
  useEffect(() => {
    if (isEditing && isSubscription && existingSubscription) {
      setVendor(existingSubscription.vendor);
      setDescription(existingSubscription.description || '');
      setCategory(existingSubscription.category ?? '');
      setAmount(String(centsToAmount(existingSubscription.amountCents)));
      setDistributionMethod(existingSubscription.distributionMethod);
      setStartDate(existingSubscription.startDate.slice(0, 10));
      setFrequency(existingSubscription.frequency);
      const parsed = parseFrequency(existingSubscription.frequency);
      setFrequencyQuantity(parsed.quantity);
      setFrequencyUnit(parsed.unit);
      setDayOfMonth(String(existingSubscription.dayOfMonth ?? 1));
      setActive(existingSubscription.active);

      // Initialize distribution rules from subscription
      const rules = existingSubscription.distributionRules as any;
      if (rules?.userIds) {
        setIncomeUserIds(new Set(rules.userIds));
      }
      if (rules?.percentRules) {
        const percents: Record<string, string> = {};
        rules.percentRules.forEach((rule: any) => {
          percents[rule.userId] = (rule.percentBasisPoints / 100).toFixed(1);
        });
        setUserPercents(percents);
      }
    }
  }, [isEditing, existingSubscription?.id, isSubscription]);

  const totalPercent = Object.values(userPercents).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);

  // Calculate income percentages for BY_INCOME display
  const activeIncomes = periodIncomes
    ? periodIncomes.filter(i => incomeUserIds.has(i.userId) && i.normalizedMonthlyGrossCents > 0)
    : [];
  const totalIncome = activeIncomes.reduce((sum, i) => sum + i.normalizedMonthlyGrossCents, 0);
  const incomePercent = (userId: string) => {
    const inc = activeIncomes.find(i => i.userId === userId);
    if (!inc || totalIncome === 0) return null;
    return ((inc.normalizedMonthlyGrossCents / totalIncome) * 100).toFixed(1);
  };

  // Equal % per user for FIXED
  const selectedForFixed = users ? users.filter(u => incomeUserIds.has(u.id)) : [];
  const equalPercent = selectedForFixed.length > 0
    ? (100 / selectedForFixed.length).toFixed(1)
    : null;

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

    if (!isEditing && !isSubscription && !currentPeriod) {
      setError(t('invoice.noPeriodWarning'));
      return;
    }
    if (!vendor.trim()) { setError(t('validation.required')); return; }

    const totalCents = amountToCents(parseFloat(amount));
    if (isNaN(totalCents) || totalCents <= 0) { setError(t('validation.invalidAmount')); return; }

    let distributionRules: { percentRules?: Array<{userId:string;percentBasisPoints:number}>; userIds?: string[] } | undefined;

    if (distributionMethod === 'BY_PERCENT') {
      if (Math.abs(totalPercent - 100) > 0.01) { setError(t('invoice.percentsMustSum')); return; }
      const percentRules = Object.entries(userPercents)
        .filter(([, v]) => parseFloat(v) > 0)
        .map(([userId, v]) => ({ userId, percentBasisPoints: Math.round(parseFloat(v) * 100) }));
      if (percentRules.length === 0) { setError(t('invoice.specifyPercent')); return; }
      distributionRules = { percentRules };
    }

    if ((distributionMethod === 'BY_INCOME' || distributionMethod === 'FIXED') && incomeUserIds.size > 0) {
      distributionRules = { ...(distributionRules ?? {}), userIds: Array.from(incomeUserIds) };
    }

    if (distributionMethod === 'FIXED' && selectedForFixed.length === 0) {
      setError(t('invoice.atLeastOneUser'));
      return;
    }

    try {
      if (isSubscription) {
        const actualFrequency = calculateFrequency(frequencyQuantity, frequencyUnit);

        const subData: any = {
          name: vendor.trim(),
          vendor: vendor.trim(),
          category: category.trim() || undefined,
          description: description.trim() || undefined,
          amountCents: totalCents,
          distributionMethod,
          frequency: actualFrequency,
          dayOfMonth: parseInt(dayOfMonth) || undefined,
          startDate,
          active,
          distributionRules: distributionRules || {},
        };

        if (isEditing) {
          await updateSubscription.mutateAsync({ id: id!, data: subData });
        } else {
          await createSubscription.mutateAsync(subData);
        }
        navigate('/subscriptions');
      } else {
        const invoiceData = {
          vendor: vendor.trim(),
          category: category.trim() || undefined,
          description: description.trim() || undefined,
          totalCents,
          distributionMethod,
          dueDate: dueDate || undefined,
          paymentMethod: paymentMethod || undefined,
          distributionRules,
        };

        if (isEditing) {
          await updateInvoice.mutateAsync({ id: id!, data: invoiceData });
        } else {
          await createInvoice.mutateAsync({
            periodId: currentPeriod!.id,
            ...invoiceData,
          });
        }
        navigate('/invoices');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || t('errors.serverError'));
    }
  };

  const isPending = createInvoice.isPending || updateInvoice.isPending ||
                   createSubscription.isPending || updateSubscription.isPending;

  const backUrl = isSubscription ? '/subscriptions' : '/invoices';
  const titleKey = isSubscription
    ? (isEditing ? 'subscription.edit' : 'subscription.add')
    : (isEditing ? 'invoice.editInvoice' : 'invoice.addInvoice');

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(backUrl)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t(titleKey)}
        </h1>
      </div>

      {!isEditing && !isSubscription && !currentPeriod && (
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-lg px-4 py-3 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{t('invoice.noPeriodWarning')}</span>
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

          {/* Active checkbox for subscriptions */}
          {isSubscription && (
            <div className="flex items-center gap-2">
              <input type="checkbox" id="active" checked={active} onChange={(e) => setActive(e.target.checked)} className="rounded border-gray-300" />
              <label htmlFor="active" className="text-sm text-gray-700 dark:text-gray-300">{t('subscription.activeLabel')}</label>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <label className={labelCls}>{t('invoice.vendor')} *</label>
              <input
                type="text"
                value={vendor}
                onChange={(e) => { setVendor(e.target.value); setShowVendorList(true); }}
                onFocus={() => setShowVendorList(true)}
                onBlur={() => setTimeout(() => setShowVendorList(false), 150)}
                required
                className={inputCls}
                placeholder={t('invoice.vendorPlaceholder')}
              />
              {showVendorList && vendors.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-44 overflow-y-auto">
                  {vendors
                    .filter(v => v.name.toLowerCase().includes(vendor.toLowerCase()))
                    .map(v => (
                      <button
                        key={v.id}
                        type="button"
                        onMouseDown={() => { setVendor(v.name); setShowVendorList(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-left"
                      >
                        {v.logoUrl && (
                          <img src={v.logoUrl} alt="" className="w-5 h-5 rounded object-contain bg-white flex-shrink-0"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        )}
                        <span>{v.name}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
            <div>
              <label className={labelCls}>{t('invoice.category')}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                <option value="">{t('invoice.categoryPlaceholder')}</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>{t('invoice.description')}</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} placeholder={isSubscription ? "e.g., Monthly payment for home loan" : t('invoice.descriptionPlaceholder')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t('invoice.amount')} *</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required step="0.01" min="0" className={inputCls} placeholder="0.00" />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('invoice.amountInCurrency', { currency })}</p>
            </div>
            {!isSubscription && (
              <div>
                <label className={labelCls}>{t('invoice.dueDate')}</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
              </div>
            )}
          </div>

          {isSubscription && (
            <>
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Every</label>
                    <input type="number" value={frequencyQuantity} onChange={(e) => setFrequencyQuantity(e.target.value)} className={inputCls} min="1" placeholder="1" />
                  </div>
                  <div>
                    <label className={labelCls}>Unit</label>
                    <select value={frequencyUnit} onChange={(e) => setFrequencyUnit(e.target.value)} className={inputCls}>
                      <option value="DAY">Day</option>
                      <option value="WEEK">Week</option>
                      <option value="MONTH">Month</option>
                      <option value="YEAR">Year</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{t('subscription.dayOfMonth')}</label>
                  <input type="number" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} className={inputCls} min="1" max="31" placeholder="1" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{t('subscription.startDate')}</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
                </div>
              </div>
            </>
          )}

          {!isSubscription && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t('invoice.paymentMethod')}</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputCls}>
                  <option value="">{t('invoice.paymentMethodPlaceholder')}</option>
                  {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className={labelCls}>{t('invoice.distributionMethod')} *</label>
            <select value={distributionMethod} onChange={(e) => setDistributionMethod(e.target.value as 'BY_INCOME' | 'BY_PERCENT' | 'FIXED')} className={inputCls}>
              <option value="BY_INCOME">{t('invoice.incomeBased')}</option>
              <option value="BY_PERCENT">{t(isSubscription ? 'subscription.customPct' : 'invoice.custom')}</option>
              <option value="FIXED">{t('invoice.equal')}</option>
            </select>
          </div>

          {/* BY_INCOME: user selection with income percentages */}
          {distributionMethod === 'BY_INCOME' && users && users.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={labelCls + ' mb-0'}>{isSubscription ? t('subscription.selectUsers') : t('invoice.selectUsers')}</label>
                {totalIncome === 0 && (
                  <span className="text-xs text-amber-600 dark:text-amber-400">{t('invoice.noIncome')}</span>
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
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex-shrink-0">{t('users.junior')}</span>
                      )}
                      {checked && pct !== null ? (
                        <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex-shrink-0">{pct}%</span>
                      ) : checked && !hasIncome ? (
                        <span className="text-xs text-amber-500 flex-shrink-0">{t('invoice.noIncomeShort')}</span>
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
                <label className={labelCls + ' mb-0'}>{t('invoice.percentPerUser')} *</label>
                <span className={`text-sm font-medium ${Math.abs(totalPercent - 100) < 0.01 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                  {t('invoice.totalLabel')} {totalPercent.toFixed(1)}%
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
                      <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex-shrink-0">{t('users.junior')}</span>
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

          {/* FIXED: equal split with user selection */}
          {distributionMethod === 'FIXED' && users && users.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={labelCls + ' mb-0'}>{t('invoice.selectUsersEqual')}</label>
                {equalPercent && (
                  <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{equalPercent}{t('invoice.eachPct')}</span>
                )}
              </div>
              <div className="space-y-2">
                {users.map((u) => {
                  const checked = incomeUserIds.has(u.id);
                  const isJunior = u.role === 'JUNIOR';
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
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex-shrink-0">{t('users.junior')}</span>
                      )}
                      {checked && equalPercent && (
                        <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex-shrink-0">{equalPercent}%</span>
                      )}
                      <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${checked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-400'}`}>
                        {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => navigate(backUrl)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={isPending || (!isEditing && !isSubscription && !currentPeriod)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg transition-colors">
              {isPending && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
