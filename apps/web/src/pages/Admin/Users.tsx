import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, AlertCircle, X, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useCurrentPeriod, useUserIncomes, useUpsertUserIncome } from '../../hooks/useApi';
import { User, UserIncome } from '../../services/api';
import { amountToCents, centsToAmount, formatCurrency } from '../../utils/currency';

const inputCls =
  'w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm';
const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

const INCOME_TYPES = [
  { value: 'ANNUAL_GROSS', label: 'Årlig brutto' },
  { value: 'MONTHLY_GROSS', label: 'Månedlig brutto' },
];

interface UserFormData {
  username: string;
  name: string;
  role: 'ADMIN' | 'ADULT' | 'JUNIOR';
  password: string;
  avatarUrl: string;
}

function UserAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  return (
    <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 overflow-hidden">
      {avatarUrl
        ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        : name.charAt(0).toUpperCase()}
    </div>
  );
}

function UserModal({
  user,
  onClose,
  onSave,
  isPending,
  error,
}: {
  user: User | null;
  onClose: () => void;
  onSave: (data: UserFormData) => void;
  isPending: boolean;
  error: string;
}) {
  const { t } = useTranslation();
  const [username, setUsername] = useState(user?.username ?? '');
  const [name, setName] = useState(user?.name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [role, setRole] = useState<'ADMIN' | 'ADULT' | 'JUNIOR'>(
    user?.role === 'ADMIN' ? 'ADMIN' : user?.role === 'JUNIOR' ? 'JUNIOR' : 'ADULT'
  );
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ username, name, role, password, avatarUrl });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            {user ? t('users.editUser') : t('users.addUser')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-semibold flex-shrink-0 overflow-hidden">
                {avatarUrl
                  ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  : (name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <label className={labelCls}>Profilbilde (URL)</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className={inputCls}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>{t('users.name')} *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>{t('users.username')} *</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>{t('users.role')}</label>
              <select value={role} onChange={(e) => setRole(e.target.value as 'ADMIN' | 'ADULT' | 'JUNIOR')} className={inputCls}>
                <option value="ADULT">{t('users.adult')}</option>
                <option value="ADMIN">{t('users.admin')}</option>
                <option value="JUNIOR">{t('users.junior')}</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>
                {t('users.password')} {user && <span className="text-gray-400 font-normal">(leave blank to keep current)</span>}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
                minLength={6}
                required={!user}
                placeholder={user ? '••••••' : ''}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
            <button type="button" onClick={onClose} className="text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={isPending} className="flex items-center gap-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg transition-colors">
              {isPending && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function IncomeModal({
  user,
  existingIncome,
  periodId,
  onClose,
}: {
  user: User;
  existingIncome: UserIncome | undefined;
  periodId: string;
  onClose: () => void;
}) {
  const upsertIncome = useUpsertUserIncome();
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeType, setIncomeType] = useState('ANNUAL_GROSS');
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingIncome) {
      setIncomeAmount(String(centsToAmount(existingIncome.inputCents)));
      setIncomeType(existingIncome.inputType);
    }
  }, [existingIncome?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const inputCents = amountToCents(parseFloat(incomeAmount));
    if (isNaN(inputCents) || inputCents <= 0) {
      setError('Ugyldig beløp');
      return;
    }
    try {
      await upsertIncome.mutateAsync({ userId: user.id, periodId, inputType: incomeType, inputCents });
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Serverfeil');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Rediger inntekt</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div>
              <label className={labelCls}>Inntektstype</label>
              <select value={incomeType} onChange={(e) => setIncomeType(e.target.value)} className={inputCls}>
                {INCOME_TYPES.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Beløp (kr)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(e.target.value)}
                className={inputCls}
                placeholder="0.00"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Beregnes automatisk til månedlig brutto for fordeling.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
            <button type="button" onClick={onClose} className="text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Avbryt
            </button>
            <button type="submit" disabled={upsertIncome.isPending} className="flex items-center gap-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg transition-colors">
              {upsertIncome.isPending && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Lagre inntekt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Users() {
  const { t } = useTranslation();
  const { data: users, isLoading } = useUsers();
  const { data: currentPeriod } = useCurrentPeriod();
  const { data: incomes } = useUserIncomes(currentPeriod?.id ?? '');
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [modalError, setModalError] = useState('');

  const [incomeModalUser, setIncomeModalUser] = useState<User | null>(null);

  const openCreate = () => { setEditingUser(null); setModalError(''); setModalOpen(true); };
  const openEdit = (u: User) => { setEditingUser(u); setModalError(''); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingUser(null); setModalError(''); };

  const handleSave = async (data: UserFormData) => {
    setModalError('');
    try {
      if (editingUser) {
        const updateData: Record<string, any> = { name: data.name, username: data.username, role: data.role, avatarUrl: data.avatarUrl || null };
        if (data.password) updateData.password = data.password;
        await updateUser.mutateAsync({ id: editingUser.id, data: updateData });
      } else {
        await createUser.mutateAsync({ name: data.name, username: data.username, role: data.role, password: data.password });
      }
      closeModal();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setModalError(Array.isArray(msg) ? msg.join(', ') : msg || t('errors.serverError'));
    }
  };

  const handleDelete = async (u: User) => {
    if (confirm(t('users.confirmDelete'))) {
      try { await deleteUser.mutateAsync(u.id); } catch { alert(t('errors.serverError')); }
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('users.title')}</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          <Plus size={16} />
          {t('users.addUser')}
        </button>
      </div>

      {!users || users.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('common.noData')}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {users.map((u) => {
              const userIncome = incomes?.find(i => i.userId === u.id);
              return (
                <div key={u.id} className="flex items-center justify-between px-5 py-4 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar name={u.name} avatarUrl={u.avatarUrl} />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{u.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">@{u.username}</p>
                      {userIncome && (
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                          {userIncome.inputType === 'ANNUAL_GROSS' ? 'Årlig' : 'Månedlig'}: {formatCurrency(userIncome.inputCents, 'NOK')}
                        </p>
                      )}
                      {!userIncome && currentPeriod && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Ingen inntekt registrert</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.role === 'ADMIN'
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                        : u.role === 'JUNIOR'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {u.role === 'ADMIN' ? t('users.admin') : u.role === 'JUNIOR' ? t('users.junior') : t('users.adult')}
                    </span>
                    {currentPeriod && (
                      <button
                        onClick={() => setIncomeModalUser(u)}
                        className="text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                        title="Rediger inntekt"
                      >
                        <TrendingUp size={16} />
                      </button>
                    )}
                    <button onClick={() => openEdit(u)} className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(u)} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {modalOpen && (
        <UserModal
          user={editingUser}
          onClose={closeModal}
          onSave={handleSave}
          isPending={createUser.isPending || updateUser.isPending}
          error={modalError}
        />
      )}

      {incomeModalUser && currentPeriod && (
        <IncomeModal
          user={incomeModalUser}
          existingIncome={incomes?.find(i => i.userId === incomeModalUser.id)}
          periodId={currentPeriod.id}
          onClose={() => setIncomeModalUser(null)}
        />
      )}
    </div>
  );
}
