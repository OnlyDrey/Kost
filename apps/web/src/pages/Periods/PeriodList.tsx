import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Lock, AlertCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePeriods, useCreatePeriod, useClosePeriod } from '../../hooks/useApi';
import { useAuth } from '../../stores/auth.context';
import { formatDate } from '../../utils/date';

const inputCls =
  'w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm';

export default function PeriodList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const { data: periods, isLoading } = usePeriods();
  const createPeriod = useCreatePeriod();
  const closePeriod = useClosePeriod();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [periodId, setPeriodId] = useState('');
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setError('');
    if (!periodId.trim()) { setError(t('validation.required')); return; }
    if (!/^\d{4}-\d{2}$/.test(periodId.trim())) { setError('Period ID must be in YYYY-MM format (e.g. 2025-03)'); return; }
    try {
      await createPeriod.mutateAsync({ id: periodId.trim() });
      setDialogOpen(false);
      setPeriodId('');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || t('errors.serverError'));
    }
  };

  const handleClose = async (id: string) => {
    if (confirm(t('period.confirmClose'))) {
      try { await closePeriod.mutateAsync(id); } catch { alert(t('errors.serverError')); }
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('period.periods')}</h1>
        {isAdmin && (
          <button onClick={() => setDialogOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            <Plus size={16} />
            {t('period.createPeriod')}
          </button>
        )}
      </div>

      {!periods || periods.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.noData')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {periods.map((period) => (
            <div key={period.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{period.id}</p>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      period.status === 'OPEN'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {period.status === 'OPEN' ? t('period.open') : t('period.closed')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('period.createdAt', { date: formatDate(period.createdAt) })}
                  </p>
                  {period.closedAt && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t('period.closedAt', { date: formatDate(period.closedAt) })}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => navigate(`/periods/${period.id}`)} className="text-sm border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors font-medium">
                    {t('period.stats')}
                  </button>
                  {isAdmin && period.status === 'OPEN' && (
                    <button onClick={() => handleClose(period.id)} className="flex items-center gap-1.5 text-sm border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors font-medium">
                      <Lock size={14} />
                      {t('period.closePeriod')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create period modal */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">{t('period.createPeriod')}</h2>
              <button onClick={() => setDialogOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Period ID (YYYY-MM) *</label>
                <input type="text" value={periodId} onChange={(e) => setPeriodId(e.target.value)} className={inputCls} placeholder="e.g., 2025-03" maxLength={7} />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Format: year-month, e.g. 2025-03 for March 2025</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
              <button onClick={() => setDialogOpen(false)} className="text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                {t('common.cancel')}
              </button>
              <button onClick={handleCreate} disabled={createPeriod.isPending} className="flex items-center gap-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg transition-colors">
                {createPeriod.isPending && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {t('common.add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
