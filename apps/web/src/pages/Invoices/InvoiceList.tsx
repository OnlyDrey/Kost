import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Pencil, CheckCircle2, Clock, Store } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useInvoices, useCurrentPeriod, useCurrency, useVendors } from '../../hooks/useApi';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { distributionLabel } from '../../utils/distribution';
import { useSettings } from '../../stores/settings.context';

const METHOD_OPTIONS = ['ALL', 'BY_INCOME', 'BY_PERCENT', 'FIXED'];
const STATUS_OPTIONS = ['ALL', 'PAID', 'PARTIALLY_PAID', 'UNPAID'] as const;
type StatusFilter = typeof STATUS_OPTIONS[number];

// STATUS_LABELS built inside the component with t() so they respect locale changes

export default function InvoiceList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { settings } = useSettings();

  const STATUS_LABELS: Record<StatusFilter, string> = {
    ALL: t('invoice.statusAll'),
    PAID: t('invoice.statusPaid'),
    PARTIALLY_PAID: t('invoice.statusPartiallyPaid'),
    UNPAID: t('invoice.statusUnpaid'),
  };

  const { data: currentPeriod } = useCurrentPeriod();
  const { data: invoices, isLoading } = useInvoices(currentPeriod?.id);
  const { data: currency = 'NOK' } = useCurrency();
  const { data: vendors = [] } = useVendors();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('ALL');

  const filteredInvoices = invoices?.filter((invoice) => {
    const searchText = `${invoice.vendor} ${invoice.description || ''} ${invoice.category}`.toLowerCase();
    const matchesSearch = searchText.includes(searchQuery.toLowerCase());
    const matchesMethod = filterMethod === 'ALL' || invoice.distributionMethod === filterMethod;

    let matchesStatus = true;
    if (filterStatus !== 'ALL') {
      const totalPaid = (invoice.payments ?? []).reduce((s, p) => s + p.amountCents, 0);
      const remaining = invoice.totalCents - totalPaid;
      if (filterStatus === 'PAID') matchesStatus = remaining <= 0;
      else if (filterStatus === 'PARTIALLY_PAID') matchesStatus = totalPaid > 0 && remaining > 0;
      else if (filterStatus === 'UNPAID') matchesStatus = totalPaid === 0;
    }

    return matchesSearch && matchesMethod && matchesStatus;
  });

  function getVendorLogo(vendorName: string) {
    return vendors.find(v => v.name.toLowerCase() === vendorName.toLowerCase())?.logoUrl;
  }

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
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.search')}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {METHOD_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m === 'ALL' ? t('invoice.distributionMethod') : distributionLabel(m, settings.locale)}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as StatusFilter)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Invoice list */}
      {!filteredInvoices || filteredInvoices.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.noData')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => {
            const totalPaid = (invoice.payments ?? []).reduce((sum, p) => sum + p.amountCents, 0);
            const remaining = invoice.totalCents - totalPaid;
            const isPaid = remaining <= 0;
            const isPartiallyPaid = totalPaid > 0 && !isPaid;
            const logoUrl = getVendorLogo(invoice.vendor);

            return (
              <div
                key={invoice.id}
                className="relative bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all"
              >
                {/* Main clickable area → detail view */}
                <button
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                  className="w-full text-left p-4 pr-12"
                >
                  <div className="flex items-start gap-3">
                    {/* Vendor logo / fallback */}
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt=""
                        className="w-10 h-10 rounded-lg object-contain bg-white border border-gray-200 dark:border-gray-700 flex-shrink-0 mt-0.5"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Store size={16} className="text-gray-400" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Vendor name + amount row */}
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{invoice.vendor}</p>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <p className={`text-lg font-bold flex-shrink-0 ${isPaid ? 'text-green-600 dark:text-green-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                            {formatCurrency(invoice.totalCents, currency)}
                          </p>
                          {isPaid && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              <CheckCircle2 size={10} /> {t('invoice.statusPaid')}
                            </span>
                          )}
                          {isPartiallyPaid && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              <Clock size={10} /> {t('invoice.remaining', { amount: formatCurrency(remaining, currency) })}
                            </span>
                          )}
                        </div>
                      </div>

                      {invoice.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{invoice.description}</p>
                      )}

                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                          {distributionLabel(invoice.distributionMethod, settings.locale)}
                        </span>
                        {invoice.category && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            {invoice.category}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatDate(invoice.createdAt)}</p>
                    </div>
                  </div>
                </button>

                {/* Edit button */}
                <button
                  onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
                  className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/20 transition-colors"
                  title={t('common.edit')}
                >
                  <Pencil size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
