import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useInvoice, useDeleteInvoice } from '../../hooks/useApi';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import AllocationExplanation from '../../components/Invoice/AllocationExplanation';

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: invoice, isLoading } = useInvoice(id!);
  const deleteInvoice = useDeleteInvoice();

  const handleDelete = async () => {
    if (confirm(t('invoice.confirmDelete'))) {
      await deleteInvoice.mutateAsync(id!);
      navigate('/invoices');
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/invoices')}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
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
              {invoice.distributionMethod}
            </span>
            {invoice.category && (
              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                {invoice.category}
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
          </div>
        </div>

        {/* Allocation explanation */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('invoice.allocationExplanation')}</h3>
          <AllocationExplanation invoice={invoice} />
        </div>

        {/* Shares */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('invoice.shares')}</h3>
          {invoice.shares && invoice.shares.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {invoice.shares.map((share) => (
                <div
                  key={share.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
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
      </div>
    </div>
  );
}
