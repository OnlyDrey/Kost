import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useInvoice, useDeleteInvoice, useAddPayment } from '../../hooks/useApi';
import { useAuth } from '../../stores/auth.context';
import { formatCurrency, amountToCents } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import AllocationExplanation from '../../components/Invoice/AllocationExplanation';
import { distributionLabel } from '../../utils/distribution';
import { useSettings } from '../../stores/settings.context';

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm';

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSettings();

  const { data: invoice, isLoading } = useInvoice(id!);
  const deleteInvoice = useDeleteInvoice();
  const addPayment = useAddPayment();

  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [payError, setPayError] = useState('');

  const handleDelete = async () => {
    if (confirm(t('invoice.confirmDelete'))) {
      await deleteInvoice.mutateAsync(id!);
      navigate('/invoices');
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');
    const amountCents = amountToCents(parseFloat(payAmount));
    if (isNaN(amountCents) || amountCents <= 0) { setPayError(t('validation.invalidAmount')); return; }

    try {
      await addPayment.mutateAsync({
        invoiceId: id!,
        data: { paidById: user!.id, amountCents, note: payNote || undefined },
      });
      setShowPayForm(false);
      setPayAmount('');
      setPayNote('');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setPayError(Array.isArray(msg) ? msg.join(', ') : msg || t('errors.serverError'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!invoice) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">{t('errors.notFound')}</p>;
  }

  const totalPaid = (invoice.payments ?? []).reduce((sum, p) => sum + p.amountCents, 0);
  const remaining = invoice.totalCents - totalPaid;
  const isPaid = remaining <= 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/invoices')} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex-1">{t('invoice.title')}</h1>
        <button
          onClick={() => navigate(`/invoices/${id}/edit`)}
          className="flex items-center gap-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Pencil size={15} />
          {t('common.edit')}
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Trash2 size={15} />
          {t('common.delete')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main info */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{invoice.vendor}{invoice.description && ` – ${invoice.description}`}</h2>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
              {distributionLabel(invoice.distributionMethod, settings.locale)}
            </span>
            {invoice.category && (
              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                {invoice.category}
              </span>
            )}
            {isPaid && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle2 size={12} /> Betalt
              </span>
            )}
          </div>

          <hr className="border-gray-100 dark:border-gray-800" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('invoice.totalAmount')}</p>
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {formatCurrency(invoice.totalCents)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('invoice.invoiceDate')}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(invoice.createdAt)}</p>
            </div>
            {invoice.dueDate && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('invoice.dueDate')}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(invoice.dueDate)}</p>
              </div>
            )}
            {totalPaid > 0 && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Betalt</p>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">{formatCurrency(totalPaid)}</p>
              </div>
            )}
            {!isPaid && totalPaid > 0 && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Gjenstående</p>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">{formatCurrency(remaining)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Allocation explanation */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('invoice.allocationExplanation')}</h3>
          <AllocationExplanation invoice={invoice} />
        </div>

        {/* Shares */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('invoice.shares')}</h3>
          {invoice.shares && invoice.shares.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {invoice.shares.map((share) => (
                <div key={share.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{share.user?.name || 'Unknown'}</p>
                  <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    {formatCurrency(share.shareCents)}
                  </p>
                  {invoice.totalCents > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {((share.shareCents / invoice.totalCents) * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.noData')}</p>
          )}
        </div>

        {/* Payments */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Betalinger</h3>
            {!isPaid && !showPayForm && (
              <button
                onClick={() => { setShowPayForm(true); setPayAmount(String(remaining / 100)); }}
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                + Merk som betalt
              </button>
            )}
          </div>

          {/* Existing payments */}
          {invoice.payments && invoice.payments.length > 0 ? (
            <div className="space-y-2 mb-4">
              {invoice.payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between text-sm border border-gray-100 dark:border-gray-800 rounded-lg px-3 py-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{payment.paidBy?.name ?? 'Ukjent'}</p>
                    <p className="text-xs text-gray-400">{formatDate(payment.paidAt)}{payment.note ? ` · ${payment.note}` : ''}</p>
                  </div>
                  <p className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(payment.amountCents)}</p>
                </div>
              ))}
            </div>
          ) : !showPayForm ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Ingen betalinger registrert</p>
          ) : null}

          {/* Add payment form */}
          {showPayForm && (
            <form onSubmit={handleAddPayment} className="space-y-3 border-t border-gray-100 dark:border-gray-800 pt-4">
              {payError && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs">
                  <AlertCircle size={13} /> <span>{payError}</span>
                </div>
              )}
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Beløp (kr)</label>
                <input type="number" step="0.01" min="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className={inputCls} required placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Notat (valgfritt)</label>
                <input type="text" value={payNote} onChange={(e) => setPayNote(e.target.value)} className={inputCls} placeholder="f.eks. bankoverføring" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowPayForm(false)} className="flex-1 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Avbryt
                </button>
                <button type="submit" disabled={addPayment.isPending} className="flex-1 flex items-center justify-center gap-1 py-2 text-sm font-semibold bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg transition-colors">
                  {addPayment.isPending && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Registrer betaling
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
