import { useState, useEffect, useRef, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  X,
  TrendingUp,
  Camera,
  ShieldCheck,
  UsersRound,
  Baby,
  Search,
  Users as UsersIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useCurrentPeriod,
  useUserIncomes,
  useUpsertUserIncome,
  useUploadAvatar,
  useRemoveAvatar,
  useCurrency,
  useCurrencyFormatter,
} from "../../hooks/useApi";
import { User, UserIncome } from "../../services/api";
import { amountToCents, centsToAmount } from "../../utils/currency";
import { useSettings } from "../../stores/settings.context";
import { useConfirmDialog } from "../../components/Common/ConfirmDialogProvider";
import { useAuth } from "../../stores/auth.context";
import ActionIconBar from "../../components/Common/ActionIconBar";

const inputCls =
  "w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm";
const labelCls =
  "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

interface UserFormData {
  username: string;
  name: string;
  role: "ADMIN" | "ADULT" | "CHILD";
  password: string;
}

function UserAvatar({
  name,
  avatarUrl,
  size = 9,
}: {
  name: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  const cls = `w-${size} h-${size}`;
  return (
    <div
      className={`${cls} rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 overflow-hidden`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  );
}

function UserModal({
  user,
  onClose,
  onSave,
  isPending,
  error,
  canEditRole,
  roleOptions,
}: {
  user: User | null;
  onClose: () => void;
  onSave: (data: UserFormData) => void;
  isPending: boolean;
  error: string;
  canEditRole: boolean;
  roleOptions: Array<"ADMIN" | "ADULT" | "CHILD">;
}) {
  const { t } = useTranslation();
  const uploadAvatar = useUploadAvatar();
  const removeAvatar = useRemoveAvatar();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState(user?.username ?? "");
  const [name, setName] = useState(user?.name ?? "");
  const [role, setRole] = useState<"ADMIN" | "ADULT" | "CHILD">(
    user?.role === "ADMIN"
      ? "ADMIN"
      : user?.role === "CHILD"
        ? "CHILD"
        : "ADULT",
  );
  const [password, setPassword] = useState("");
  const [localAvatarUrl, setLocalAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [avatarErr, setAvatarErr] = useState("");

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarErr("");
    try {
      const updated = await uploadAvatar.mutateAsync({ id: user.id, file });
      setLocalAvatarUrl(updated.avatarUrl ?? "");
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setAvatarErr(
        Array.isArray(msg) ? msg.join(", ") : msg || t("errors.serverError"),
      );
    }
    e.target.value = "";
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    setAvatarErr("");
    try {
      const updated = await removeAvatar.mutateAsync(user.id);
      setLocalAvatarUrl(updated.avatarUrl ?? "");
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setAvatarErr(
        Array.isArray(msg) ? msg.join(", ") : msg || t("errors.serverError"),
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ username, name, role, password });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            {user ? t("users.editUser") : t("users.addUser")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
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

            {/* Avatar upload — only for existing users */}
            {user && (
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-semibold flex-shrink-0 overflow-hidden">
                    {localAvatarUrl ? (
                      <img
                        src={localAvatarUrl}
                        alt={name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      (name || "?").charAt(0).toUpperCase()
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <Camera size={16} className="text-white" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFile}
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadAvatar.isPending}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-60"
                  >
                    <Camera size={12} /> {t("users.selectPhoto")}
                  </button>
                  {localAvatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={removeAvatar.isPending}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-60"
                    >
                      <Trash2 size={12} /> {t("users.removePhoto")}
                    </button>
                  )}
                  {avatarErr && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {avatarErr}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className={labelCls}>{t("users.name")} *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>{t("users.username")} *</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>{t("users.role")}</label>
              <select
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "ADMIN" | "ADULT" | "CHILD")
                }
                className={inputCls}
                disabled={!canEditRole}
              >
                {roleOptions.map((roleOption) => (
                  <option key={roleOption} value={roleOption}>
                    {roleOption === "ADMIN"
                      ? t("users.admin")
                      : roleOption === "CHILD"
                        ? t("users.junior")
                        : t("users.adult")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>
                {t("users.password")}{" "}
                {user && (
                  <span className="text-gray-400 font-normal">
                    ({t("users.keepCurrentPassword")})
                  </span>
                )}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
                minLength={6}
                required={!user}
                placeholder={user ? "••••••" : ""}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {isPending && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {t("common.save")}
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
  const { t } = useTranslation();
  const upsertIncome = useUpsertUserIncome();
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeType, setIncomeType] = useState("ANNUAL_GROSS");
  const [error, setError] = useState("");

  useEffect(() => {
    if (existingIncome) {
      setIncomeAmount(String(centsToAmount(existingIncome.inputCents)));
      setIncomeType(existingIncome.inputType);
    }
  }, [existingIncome?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const inputCents = amountToCents(parseFloat(incomeAmount));
    if (isNaN(inputCents) || inputCents <= 0) {
      setError(t("income.invalidAmount"));
      return;
    }
    try {
      await upsertIncome.mutateAsync({
        userId: user.id,
        periodId,
        inputType: incomeType,
        inputCents,
      });
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(
        Array.isArray(msg) ? msg.join(", ") : msg || t("errors.serverError"),
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              {t("users.editIncome")}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {user.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
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
              <label className={labelCls}>{t("income.type")}</label>
              <select
                value={incomeType}
                onChange={(e) => setIncomeType(e.target.value)}
                className={inputCls}
              >
                <option value="ANNUAL_GROSS">{t("income.annual")}</option>
                <option value="MONTHLY_GROSS">{t("income.monthly")}</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>{t("income.amount")}</label>
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
                {t("income.autoConverted")}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={upsertIncome.isPending}
              className="flex items-center gap-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {upsertIncome.isPending && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {t("income.saveButton")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Users({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation();
  const { notify } = useConfirmDialog();
  const { isAdmin, user: currentUser } = useAuth();
  const { data: users, isLoading } = useUsers();
  const { data: currentPeriod } = useCurrentPeriod();
  const { data: incomes } = useUserIncomes(currentPeriod?.id ?? "");
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const { data: currency = "NOK" } = useCurrency();
  const { settings } = useSettings();
  const fmt = useCurrencyFormatter();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [modalError, setModalError] = useState("");
  const [incomeModalUser, setIncomeModalUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<
    "ALL" | "ADMIN" | "ADULT" | "CHILD"
  >("ALL");

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return (users ?? []).filter((u) => {
      const roleMatch = roleFilter === "ALL" || u.role === roleFilter;
      if (!roleMatch) return false;
      if (!query) return true;
      return (
        u.name.toLowerCase().includes(query) ||
        u.username.toLowerCase().includes(query) ||
        `@${u.username.toLowerCase()}`.includes(query)
      );
    });
  }, [users, searchTerm, roleFilter]);

  const openCreate = () => {
    if (!isAdmin) return;
    setEditingUser(null);
    setModalError("");
    setModalOpen(true);
  };
  const openEdit = (u: User) => {
    setEditingUser(u);
    setModalError("");
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    setModalError("");
  };

  const handleSave = async (data: UserFormData) => {
    setModalError("");
    try {
      if (editingUser) {
        const updateData: Record<string, any> = {
          name: data.name,
          username: data.username,
        };
        if (
          isAdmin ||
          (currentUser?.role === "ADULT" &&
            editingUser.role === "CHILD" &&
            data.role === "ADULT")
        ) {
          updateData.role = data.role;
        }
        if (data.password) updateData.password = data.password;
        await updateUser.mutateAsync({ id: editingUser.id, data: updateData });
      } else {
        if (!isAdmin) return;
        await createUser.mutateAsync({
          name: data.name,
          username: data.username,
          role: data.role,
          password: data.password,
        });
      }
      closeModal();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setModalError(
        Array.isArray(msg) ? msg.join(", ") : msg || t("errors.serverError"),
      );
    }
  };

  const handleDelete = async (u: User) => {
    if (!isAdmin) return;
    try {
      await deleteUser.mutateAsync(u.id);
    } catch {
      await notify(t("errors.serverError"), t("common.error"));
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
      <div className="flex items-center justify-between gap-3">
        {embedded ? (
          <div className="flex items-center gap-2 min-w-0">
            <UsersIcon
              size={18}
              className="text-indigo-600 dark:text-indigo-400"
            />
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {t("users.title")}
            </h2>
          </div>
        ) : (
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t("users.title")}
          </h1>
        )}
        {isAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0"
          >
            <Plus size={16} />
            {t("users.addUser")}
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4 shadow-sm">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("users.searchPlaceholder")}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(
                e.target.value as "ALL" | "ADMIN" | "ADULT" | "CHILD",
              )
            }
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="ALL">{t("users.roleAll")}</option>
            <option value="ADMIN">{t("users.admin")}</option>
            <option value="ADULT">{t("users.adult")}</option>
            <option value="CHILD">{t("users.junior")}</option>
          </select>
        </div>
      </div>

      {!users || users.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("common.noData")}
          </p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 text-center shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("users.noMatches")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-3">
          {filteredUsers.map((u) => {
            const userIncome = incomes?.find((i) => i.userId === u.id);
            return (
              <div
                key={u.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm flex flex-col gap-4"
              >
                <div className="flex items-center justify-between gap-3 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar name={u.name} avatarUrl={u.avatarUrl} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate min-w-0">
                          {u.name}
                        </p>
                        <span
                          title={
                            u.role === "ADMIN"
                              ? t("users.admin")
                              : u.role === "CHILD"
                                ? t("users.junior")
                                : t("users.adult")
                          }
                          aria-label={
                            u.role === "ADMIN"
                              ? t("users.admin")
                              : u.role === "CHILD"
                                ? t("users.junior")
                                : t("users.adult")
                          }
                          className={`inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
                            u.role === "ADMIN"
                              ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                              : u.role === "CHILD"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          {u.role === "ADMIN" ? (
                            <ShieldCheck size={12} />
                          ) : u.role === "CHILD" ? (
                            <Baby size={12} />
                          ) : (
                            <UsersRound size={12} />
                          )}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        @{u.username}
                      </p>
                      {userIncome && (
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                          {userIncome.inputType === "ANNUAL_GROSS"
                            ? t("users.incomeAnnual")
                            : t("users.incomeMonthly")}
                          : {fmt(userIncome.inputCents)}
                        </p>
                      )}
                      {!userIncome && currentPeriod && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                          {t("income.noneRecorded")}
                        </p>
                      )}
                    </div>
                  </div>

                  <ActionIconBar
                    tight
                    items={[
                      {
                        key: "income",
                        icon: TrendingUp,
                        label: t("users.editIncome"),
                        onClick: () => setIncomeModalUser(u),
                        hidden: !currentPeriod,
                        colorClassName:
                          "bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400",
                      },
                      {
                        key: "edit",
                        icon: Pencil,
                        label: t("common.edit"),
                        onClick: () => openEdit(u),
                        colorClassName:
                          "bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400",
                        hidden:
                          !isAdmin &&
                          !(
                            currentUser?.role === "ADULT" && u.role === "CHILD"
                          ),
                      },
                      {
                        key: "delete",
                        icon: Trash2,
                        label: t("common.delete"),
                        onClick: () => handleDelete(u),
                        destructive: true,
                        confirmMessage: t("users.confirmDelete"),
                        colorClassName:
                          "bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400",
                        hidden: !isAdmin,
                      },
                    ]}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <UserModal
          user={editingUser}
          onClose={closeModal}
          onSave={handleSave}
          isPending={createUser.isPending || updateUser.isPending}
          error={modalError}
          canEditRole={
            isAdmin ||
            (!!editingUser &&
              currentUser?.role === "ADULT" &&
              editingUser.role === "CHILD")
          }
          roleOptions={
            isAdmin
              ? ["ADULT", "ADMIN", "CHILD"]
              : editingUser?.role === "CHILD"
                ? ["CHILD", "ADULT"]
                : [editingUser?.role === "ADMIN" ? "ADMIN" : "ADULT"]
          }
        />
      )}

      {incomeModalUser && currentPeriod && (
        <IncomeModal
          user={incomeModalUser}
          existingIncome={incomes?.find((i) => i.userId === incomeModalUser.id)}
          periodId={currentPeriod.id}
          onClose={() => setIncomeModalUser(null)}
        />
      )}
    </div>
  );
}
