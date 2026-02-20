import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCreateInvoice } from '../../hooks/useApi';
import { useAuth } from '../../stores/auth.context';
import { centsToAmount, amountToCents } from '../../utils/currency';

interface CustomShare {
  userId: string;
  amount: string;
}

const inputCls =
  'w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm';

const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

export default function AddInvoice() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const createInvoice = useCreateInvoice();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [distributionMethod, setDistributionMethod] = useState<'EQUAL' | 'CUSTOM' | 'INCOME_BASED'>('EQUAL');
  const [category, setCategory] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [customShares, setCustomShares] = useState<CustomShare[]>([]);
  const [error, setError] = useState('');

  const familyMembers = [{ id: user?.id || '1', name: user?.name || 'You' }, { id: '2', name: 'Partner' }];

  const handleAddShare = () => setCustomShares([...customShares, { userId: '', amount: '' }]);
  const handleRemoveShare = (i: number) => setCustomShares(customShares.filter((_, idx) => idx !== i));
  const handleShareChange = (i: number, field: 'userId' | 'amount', value: string) => {
    const next = [...customShares];
    next[i] = { ...next[i], [field]: value };
    setCustomShares(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!description.trim()) { setError(t('validation.required')); return; }

    const totalAmountCents = amountToCents(parseFloat(amount));
    if (isNaN(totalAmountCents) || totalAmountCents <= 0) { setError(t('validation.invalidAmount')); return; }

    let customSharesData: Array<{ userId: string; shareCents: number }> | undefined;
    if (distributionMethod === 'CUSTOM') {
      if (customShares.length === 0) { setError('Please add at least one custom share'); return; }
      customSharesData = customShares.map((s) => ({ userId: s.userId, shareCents: amountToCents(parseFloat(s.amount)) }));
      const total = customSharesData.reduce((sum, s) => sum + s.shareCents, 0);
      if (total !== totalAmountCents) {
        setError(`Custom shares (${centsToAmount(total)} kr) must equal total amount (${centsToAmount(totalAmountCents)} kr)`);
        return;
      }
    }

    try {
      await createInvoice.mutateAsync({
        description, totalAmountCents, distributionMethod,
        category: category || undefined, paidBy: user?.id, invoiceDate,
        dueDate: dueDate || undefined, customShares: customSharesData,
      });
      navigate('/invoices');
    } catch {
      setError(t('errors.serverError'));
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

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className={labelCls}>{t('invoice.description')} *</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required className={inputCls} placeholder="e.g., Electricity bill" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t('invoice.amount')} *</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required step="0.01" min="0" className={inputCls} placeholder="0.00" />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Amount in kr</p>
            </div>
            <div>
              <label className={labelCls}>{t('invoice.category')}</label>
              <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls} placeholder="e.g., Utilities" />
            </div>
            <div>
              <label className={labelCls}>{t('invoice.invoiceDate')} *</label>
              <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{t('invoice.dueDate')}</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>{t('invoice.distributionMethod')} *</label>
            <select value={distributionMethod} onChange={(e) => setDistributionMethod(e.target.value as any)} className={inputCls}>
              <option value="EQUAL">{t('invoice.equal')}</option>
              <option value="CUSTOM">{t('invoice.custom')}</option>
              <option value="INCOME_BASED">{t('invoice.incomeBased')}</option>
            </select>
          </div>

          {distributionMethod === 'CUSTOM' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('invoice.customShares')}</p>
                <button type="button" onClick={handleAddShare} className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                  <Plus size={14} />
                  {t('invoice.addShare')}
                </button>
              </div>
              <div className="space-y-2">
                {customShares.map((share, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <select value={share.userId} onChange={(e) => handleShareChange(i, 'userId', e.target.value)} required className={`flex-1 ${inputCls}`}>
                      <option value="">{t('invoice.selectUser')}</option>
                      {familyMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <input type="number" value={share.amount} onChange={(e) => handleShareChange(i, 'amount', e.target.value)} required step="0.01" min="0" placeholder="0.00" className={`flex-1 ${inputCls}`} />
                    <button type="button" onClick={() => handleRemoveShare(i)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors flex-shrink-0">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => navigate('/invoices')} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={createInvoice.isPending} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg transition-colors">
              {createInvoice.isPending && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {t('invoice.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
