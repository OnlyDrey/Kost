import { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, User, KeyRound, TrendingUp, Camera, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../stores/auth.context';
import { useUpdateUser, useChangePassword, useCurrentPeriod, useUserIncomes, useUpsertUserIncome, useUploadAvatar, useRemoveAvatar } from '../../hooks/useApi';
import { amountToCents, centsToAmount } from '../../utils/currency';

const inputCls =
  'w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm';
const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

const INCOME_TYPES = [
  { value: 'ANNUAL_GROSS', label: 'Årlig brutto' },
  { value: 'MONTHLY_GROSS', label: 'Månedlig brutto' },
];

export default function Profile() {
  const { t } = useTranslation();
  const { user, login } = useAuth();
  const updateUser = useUpdateUser();
  const changePassword = useChangePassword();
  const uploadAvatar = useUploadAvatar();
  const removeAvatar = useRemoveAvatar();
  const { data: currentPeriod } = useCurrentPeriod();
  const { data: incomes } = useUserIncomes(currentPeriod?.id ?? '');
  const upsertIncome = useUpsertUserIncome();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Profile form
  const [name, setName] = useState(user?.name ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [avatarError, setAvatarError] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  // Income form
  const myIncome = incomes?.find(i => i.userId === user?.id);
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeType, setIncomeType] = useState('ANNUAL_GROSS');
  const [incomeError, setIncomeError] = useState('');
  const [incomeSuccess, setIncomeSuccess] = useState(false);

  useEffect(() => {
    if (myIncome) {
      setIncomeAmount(String(centsToAmount(myIncome.inputCents)));
      setIncomeType(myIncome.inputType);
    }
  }, [myIncome?.id]);

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarError('');
    try {
      const updated = await uploadAvatar.mutateAsync({ id: user.id, file });
      login(updated);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setAvatarError(Array.isArray(msg) ? msg.join(', ') : msg || t('errors.serverError'));
    }
    e.target.value = '';
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    setAvatarError('');
    try {
      const updated = await removeAvatar.mutateAsync(user.id);
      login(updated);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setAvatarError(Array.isArray(msg) ? msg.join(', ') : msg || t('errors.serverError'));
    }
  };

  const handleSaveIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    setIncomeError('');
    setIncomeSuccess(false);
    if (!user || !currentPeriod) return;
    const inputCents = amountToCents(parseFloat(incomeAmount));
    if (isNaN(inputCents) || inputCents <= 0) {
      setIncomeError(t('validation.invalidAmount'));
      return;
    }
    if (!confirm('Er du sikker på at du vil lagre denne inntekten? Dette påvirker fordelingen av utgifter.')) return;
    try {
      await upsertIncome.mutateAsync({ userId: user.id, periodId: currentPeriod.id, inputType: incomeType, inputCents });
      setIncomeSuccess(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setIncomeError(Array.isArray(msg) ? msg.join(', ') : msg || t('errors.serverError'));
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    if (!user) return;
    try {
      const updatedUser = await updateUser.mutateAsync({
        id: user.id,
        data: { name: name.trim(), username: username.trim() },
      });
      login(updatedUser);
      setProfileSuccess(t('settings.profileUpdated'));
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setProfileError(Array.isArray(msg) ? msg.join(', ') : msg || t('errors.serverError'));
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (newPassword !== confirmPassword) { setPwError(t('settings.passwordMismatch')); return; }
    if (newPassword.length < 6) { setPwError('Password must be at least 6 characters'); return; }
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setPwSuccess(t('settings.passwordChanged'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setPwError(Array.isArray(msg) ? msg.join(', ') : msg || t('errors.serverError'));
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('settings.title')}</h1>

      {/* Profile section */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <User size={18} className="text-indigo-600 dark:text-indigo-400" />
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">{t('settings.profile')}</h2>
        </div>

        {/* Avatar upload */}
        <div className="flex items-center gap-5 mb-6">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-semibold flex-shrink-0 overflow-hidden">
              {user?.avatarUrl
                ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                : user?.name.charAt(0).toUpperCase()}
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              title="Bytt profilbilde"
            >
              <Camera size={20} className="text-white" />
            </button>
          </div>
          <div className="space-y-2">
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadAvatar.isPending}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-60"
            >
              {uploadAvatar.isPending
                ? <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                : <Camera size={14} />}
              Velg bilde
            </button>
            {user?.avatarUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={removeAvatar.isPending}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-60"
              >
                {removeAvatar.isPending
                  ? <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  : <Trash2 size={14} />}
                Fjern bilde
              </button>
            )}
            {avatarError && <p className="text-xs text-red-600 dark:text-red-400">{avatarError}</p>}
            <p className="text-xs text-gray-400 dark:text-gray-500">Maks 5 MB · JPG, PNG, WebP</p>
          </div>
        </div>

        {profileError && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm mb-4">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{profileError}</span>
          </div>
        )}
        {profileSuccess && (
          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg px-4 py-3 text-sm mb-4">
            <CheckCircle2 size={15} className="flex-shrink-0" />
            <span>{profileSuccess}</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>{t('users.name')}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} required />
          </div>
          <div>
            <label className={labelCls}>{t('users.username')}</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={inputCls} required />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateUser.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg transition-colors"
            >
              {updateUser.isPending && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>

      {/* Income section */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={18} className="text-indigo-600 dark:text-indigo-400" />
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Min inntekt</h2>
        </div>

        {!currentPeriod && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Ingen aktiv periode funnet.</p>
        )}

        {currentPeriod && (
          <>
            {incomeError && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm mb-4">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{incomeError}</span>
              </div>
            )}
            {incomeSuccess && (
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg px-4 py-3 text-sm mb-4">
                <CheckCircle2 size={15} className="flex-shrink-0" />
                <span>Inntekt lagret</span>
              </div>
            )}
            <form onSubmit={handleSaveIncome} className="space-y-4">
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
                <input type="number" step="0.01" min="0" value={incomeAmount} onChange={(e) => setIncomeAmount(e.target.value)} className={inputCls} placeholder="0.00" required />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Beregnes automatisk til månedlig brutto for fordeling.</p>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={upsertIncome.isPending || !currentPeriod} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg transition-colors">
                  {upsertIncome.isPending && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {t('common.save')}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* Change password section */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <KeyRound size={18} className="text-indigo-600 dark:text-indigo-400" />
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">{t('settings.changePassword')}</h2>
        </div>

        {pwError && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm mb-4">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{pwError}</span>
          </div>
        )}
        {pwSuccess && (
          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg px-4 py-3 text-sm mb-4">
            <CheckCircle2 size={15} className="flex-shrink-0" />
            <span>{pwSuccess}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>{t('settings.currentPassword')}</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputCls} required />
          </div>
          <div>
            <label className={labelCls}>{t('settings.newPassword')}</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} required minLength={6} />
          </div>
          <div>
            <label className={labelCls}>{t('settings.confirmPassword')}</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputCls} required minLength={6} />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={changePassword.isPending} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg transition-colors">
              {changePassword.isPending && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {t('settings.changePassword')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
