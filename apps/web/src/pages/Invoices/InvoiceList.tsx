import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useInvoices, useCurrentPeriod } from '../../hooks/useApi';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';

const METHOD_OPTIONS = ['ALL', 'BY_INCOME', 'BY_PERCENT', 'FIXED'];

export default function InvoiceList() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: currentPeriod } = useCurrentPeriod();
  const { data: invoices, isLoading } = useInvoices(currentPeriod?.id);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState('ALL');

  const filteredInvoices = invoices?.filter((invoice) => {
    const searchText = `${invoice.vendor} ${invoice.description || ''} ${invoice.category}`.toLowerCase();
    const matchesSearch = searchText.includes(searchQuery.toLowerCase());
    const matchesMethod = filterMethod === 'ALL' || invoice.distributionMethod === filterMethod;
    return matchesSearch && matchesMethod;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('invoice.invoices')}</h1>
        <button
          onClick={() => navigate('/invoices/add')}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus size={16} />
          {t('invoice.addInvoice')}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.search')}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterMethod}
          onChange={(e) => setFilterMethod(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          {METHOD_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {m === 'ALL' ? t('common.filter') : t(`invoice.${m.toLowerCase().replace('_', '')}`, m)}
            </option>
          ))}
        </select>
      </div>

      {/* Invoice list */}
      {!filteredInvoices || filteredInvoices.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.noData')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{invoice.vendor}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                      {invoice.distributionMethod}
                    </span>
                    {invoice.category && (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        {invoice.category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {invoice.description && `${invoice.description} · `}{formatDate(invoice.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(invoice.totalCents)}
                  </p>
                  <button
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                    className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
