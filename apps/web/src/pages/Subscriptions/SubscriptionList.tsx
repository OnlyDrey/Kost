import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Play, Power, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  useSubscriptions, useCreateSubscription, useUpdateSubscription,
  useToggleSubscription, useDeleteSubscription, useGenerateSubscriptionInvoices,
  useCurrentPeriod, useUsers, useCurrency, useCategories, useVendors,
} from '../../hooks/useApi';
import { formatCurrency, amountToCents, centsToAmount } from '../../utils/currency';
import { Subscription } from '../../services/api';
import { formatDate } from '../../utils/date';

const inputCls =
  'w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm';
const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

const FREQUENCY_VALUES = ['MONTHLY', 'QUARTERLY', 'YEARLY'];

interface FormState {
  name: string;
  vendor: string;
  category: string;
  amount: string;
  frequency: string;
  dayOfMonth: string;
  startDate: string;
  distributionMethod: 'BY_INCOME' | 'BY_PERCENT' | 'FIXED';
  active: boolean;
  selectedUserIds: Set<string>;
  userPercents: Record<string, string>;
}

const defaultForm = (): FormState => ({
  name: '',
  vendor: '',
  category: '',
  amount: '',
  frequency: 'MONTHLY',
  dayOfMonth: '1',
  startDate: new Date().toISOString().slice(0, 10),
  distributionMethod: 'BY_INCOME',
  active: true,
  selectedUserIds: new Set(),
  userPercents: {},
});

function SubscriptionForm({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial?: FormState;
  onSave: (form: FormState) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const { t } = useTranslation();
  const { data: users = [] } = useUsers();
  const { data: categories = [] } = useCategories();
  const { data: vendors = [] } = useVendors();
  const { data: currency = 'NOK' } = useCurrency();
  const [form, setForm] = useState<FormState>(initial ?? defaultForm());
  const [error, setError] = useState('');
  const [showVendorList, setShowVendorList] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm(initial);
    }
  }, [initial]);

  const set = (key: keyof FormState, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError(t('subscription.nameRequired')); return; }
    if (!form.vendor.trim()) { setError(t('subscription.vendorRequired')); return; }
    const cents = amountToCents(parseFloat(form.amount));
    if (isNaN(cents) || cents <= 0) { setError(t('income.invalidAmount')); return; }
    onSave({ ...form, amount: String(centsToAmount(cents)) });
  };

  const toggleUser = (userId: string) => {
    const next = new Set(form.selectedUserIds);
    if (next.has(userId)) { next.delete(userId); } else { next.add(userId); }
    set('selectedUserIds', next);
  };

  const freqLabel = (value: string) => {
    if (value === 'MONTHLY') return t('subscription.monthly');
    if (value === 'QUARTERLY') return t('subscription.quarterly');
    if (value === 'YEARLY') return t('subscription.yearly');
    return value;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
          <AlertCircle size={15} className="flex-shrink-0" /><span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>{t('subscription.name')} *</label>
          <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="f.eks. Boliglån" required />
        </div>
        <div className="relative">
          <label className={labelCls}>{t('invoice.vendor')} *</label>
          <input
            type="text"
            value={form.vendor}
            onChange={e => { set('vendor', e.target.value); setShowVendorList(true); }}
            onFocus={() => setShowVendorList(true)}
            onBlur={() => setTimeout(() => setShowVendorList(false), 150)}
            className={inputCls}
            placeholder={t('invoice.vendorPlaceholder')}
            required
          />
          {showVendorList && vendors.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
              {vendors
                .filter(v => v.name.toLowerCase().includes(form.vendor.toLowerCase()))
                .map(v => (
                  <button
                    key={v.id}
                    type="button"
                    onMouseDown={() => { set('vendor', v.name); setShowVendorList(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-left"
                  >
                    {v.logoUrl && <img src={v.logoUrl} alt="" className="w-5 h-5 rounded object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                    <span>{v.name}</span>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>{t('invoice.category')}</label>
          <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
            <option value="">{t('invoice.categoryPlaceholder')}</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>{t('invoice.amountInCurrency', { currency })} *</label>
          <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} className={inputCls} placeholder="0.00" step="0.01" min="0" required />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>{t('subscription.frequency')}</label>
          <select value={form.frequency} onChange={e => set('frequency', e.target.value)} className={inputCls}>
            {FREQUENCY_VALUES.map(f => <option key={f} value={f}>{freqLabel(f)}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>{t('subscription.dayOfMonth')}</label>
          <input type="number" value={form.dayOfMonth} onChange={e => set('dayOfMonth', e.target.value)} className={inputCls} min="1" max="31" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>{t('subscription.startDate')}</label>
          <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>{t('invoice.distributionMethod')}</label>
        <select value={form.distributionMethod} onChange={e => set('distributionMethod', e.target.value as any)} className={inputCls}>
          <option value="BY_INCOME">{t('invoice.incomeBased')}</option>
          <option value="FIXED">{t('invoice.equal')}</option>
          <option value="BY_PERCENT">{t('subscription.customPct')}</option>
        </select>
      </div>

      {(form.distributionMethod === 'BY_INCOME' || form.distributionMethod === 'FIXED') && users.length > 0 && (
        <div className="space-y-2">
          <label className={labelCls + ' mb-0'}>{t('subscription.selectUsers')}</label>
          <div className="space-y-1.5">
            {users.map(u => {
              const checked = form.selectedUserIds.has(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleUser(u.id)}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 border transition-colors text-left text-sm ${
                    checked ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-50'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${checked ? 'bg-indigo-600' : 'bg-gray-400'}`}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1">{u.name}</span>
                  <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${checked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-400'}`}>
                    {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {form.distributionMethod === 'BY_PERCENT' && users.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className={labelCls + ' mb-0'}>{t('invoice.percentPerUser')} *</label>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {Object.values(form.userPercents).reduce((sum, v) => sum + (parseFloat(v) || 0), 0).toFixed(1)}%
            </span>
          </div>
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 text-sm text-gray-900 dark:text-gray-100">{u.name}</span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <input
                    type="number" min="0" max="100" step="0.1"
                    value={form.userPercents[u.id] ?? ''}
                    onChange={(e) => set('userPercents', { ...form.userPercents, [u.id]: e.target.value })}
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

      <div className="flex items-center gap-2">
        <input type="checkbox" id="active" checked={form.active} onChange={e => set('active', e.target.checked)} className="rounded border-gray-300" />
        <label htmlFor="active" className="text-sm text-gray-700 dark:text-gray-300">{t('subscription.activeLabel')}</label>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          {t('common.cancel')}
        </button>
        <button type="submit" disabled={isPending} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg transition-colors">
          {isPending && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {t('common.save')}
        </button>
      </div>
    </form>
  );
}

export default function SubscriptionList() {
  const { t } = useTranslation();
  const { data: subscriptions = [], isLoading } = useSubscriptions();
  const { data: currentPeriod } = useCurrentPeriod();
  const { data: currency = 'NOK' } = useCurrency();

  const createSub = useCreateSubscription();
  const updateSub = useUpdateSubscription();
  const toggleSub = useToggleSubscription();
  const deleteSub = useDeleteSubscription();
  const generateInvoices = useGenerateSubscriptionInvoices();

  const [showForm, setShowForm] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [generateResult, setGenerateResult] = useState('');
  const [generateError, setGenerateError] = useState('');

  const subToForm = (sub: Subscription): FormState => {
    const percentRules = ((sub.distributionRules as any)?.percentRules ?? []) as Array<{ userId: string; percentBasisPoints: number }>;
    const userPercents: Record<string, string> = {};
    percentRules.forEach(rule => {
      userPercents[rule.userId] = (rule.percentBasisPoints / 100).toFixed(1);
    });
    return {
      name: sub.name,
      vendor: sub.vendor,
      category: sub.category ?? '',
      amount: String(centsToAmount(sub.amountCents)),
      frequency: sub.frequency,
      dayOfMonth: String(sub.dayOfMonth ?? 1),
      startDate: sub.startDate.slice(0, 10),
      distributionMethod: sub.distributionMethod,
      active: sub.active,
      selectedUserIds: new Set((sub.distributionRules as any)?.userIds ?? []),
      userPercents,
    };
  };

  const formToPayload = (form: FormState) => {
    const amountCents = Math.round(parseFloat(form.amount) * 100);
    const userIds = Array.from(form.selectedUserIds);

    let distributionRules: any = {};
    if (form.distributionMethod === 'BY_PERCENT') {
      const percentRules = Object.entries(form.userPercents)
        .filter(([, v]) => parseFloat(v) > 0)
        .map(([userId, v]) => ({ userId, percentBasisPoints: Math.round(parseFloat(v) * 100) }));
      if (percentRules.length > 0) {
        distributionRules = { percentRules };
      }
    } else if (userIds.length > 0) {
      distributionRules = { userIds };
    }

    return {
      name: form.name.trim(),
      vendor: form.vendor.trim(),
      category: form.category.trim() || undefined,
      amountCents,
      frequency: form.frequency,
      dayOfMonth: parseInt(form.dayOfMonth) || undefined,
      startDate: form.startDate,
      distributionMethod: form.distributionMethod,
      distributionRules,
      active: form.active,
    };
  };

  const handleCreate = async (form: FormState) => {
    await createSub.mutateAsync(formToPayload(form));
    setShowForm(false);
  };

  const handleUpdate = async (form: FormState) => {
    if (!editingSub) return;
    await updateSub.mutateAsync({ id: editingSub.id, data: formToPayload(form) });
    setEditingSub(null);
  };

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
    <div className="space-y-5 max-w-3xl">
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
              onClick={() => { setShowForm(true); setEditingSub(null); }}
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

      {(showForm || editingSub) && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-indigo-200 dark:border-indigo-800 p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-5">
            {editingSub ? t('subscription.edit') : t('subscription.new')}
          </h2>
          <SubscriptionForm
            initial={editingSub ? subToForm(editingSub) : undefined}
            onSave={editingSub ? handleUpdate : handleCreate}
            onCancel={() => { setShowForm(false); setEditingSub(null); }}
            isPending={createSub.isPending || updateSub.isPending}
          />
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
              onEdit={() => { setEditingSub(sub); setShowForm(false); }}
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
              onEdit={() => { setEditingSub(sub); setShowForm(false); }}
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
