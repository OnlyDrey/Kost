import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCreateInvoice, useCurrentPeriod } from '../../hooks/useApi';
import { amountToCents } from '../../utils/currency';

const inputCls =
  'w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm';

const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

export default function AddInvoice() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createInvoice = useCreateInvoice();
  const { data: currentPeriod } = useCurrentPeriod();

  const [vendor, setVendor] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [distributionMethod, setDistributionMethod] = useState<'BY_INCOME' | 'BY_PERCENT' | 'FIXED'>('BY_INCOME');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPeriod) { setError('No active period found'); return; }
    if (!vendor.trim()) { setError(t('validation.required')); return; }
    if (!category.trim()) { setError(t('validation.required')); return; }

    const totalCents = amountToCents(parseFloat(amount));
    if (isNaN(totalCents) || totalCents <= 0) { setError(t('validation.invalidAmount')); return; }

    try {
      await createInvoice.mutateAsync({
        periodId: currentPeriod.id,
        vendor: vendor.trim(),
        category: category.trim(),
        description: description.trim() || undefined,
        totalCents,
        distributionMethod,
        dueDate: dueDate || undefined,
      });
      navigate('/invoices');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || t('errors.serverError'));
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/invoices')} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('invoice.addInvoice')}</h1>
      </div>

      {!currentPeriod && (
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t('invoice.amount')} *</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required step="0.01" min="0" className={inputCls} placeholder="0.00" />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Amount in kr</p>
            </div>
            <div>
              <label className={labelCls}>{t('invoice.dueDate')}</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>{t('invoice.distributionMethod')} *</label>
            <select value={distributionMethod} onChange={(e) => setDistributionMethod(e.target.value as 'BY_INCOME' | 'BY_PERCENT' | 'FIXED')} className={inputCls}>
              <option value="BY_INCOME">{t('invoice.incomeBased')}</option>
              <option value="BY_PERCENT">{t('invoice.custom')}</option>
              <option value="FIXED">{t('invoice.equal')}</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {distributionMethod === 'BY_INCOME' && 'Automatically splits based on each member\'s income.'}
              {distributionMethod === 'BY_PERCENT' && 'Splits by percentage rules configured in the system.'}
              {distributionMethod === 'FIXED' && 'Uses fixed amount rules per member.'}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => navigate('/invoices')} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={createInvoice.isPending || !currentPeriod} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg transition-colors">
              {createInvoice.isPending && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {t('invoice.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
