import { ReactNode, useState, useEffect, useRef } from "react";
import {
  AlertCircle,
  CheckCircle2,
  User,
  KeyRound,
  TrendingUp,
  Camera,
  Trash2,
  ShieldCheck,
  Globe,
  Users,
  Palette,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../stores/auth.context";
import { useConfirmDialog } from "../../components/Common/ConfirmDialogProvider";
import {
  useSettings,
  type BrandingPreset,
} from "../../stores/settings.context";
import {
  useUpdateUser,
  useChangePassword,
  useCurrentPeriod,
  useUserIncomes,
  useUpsertUserIncome,
  useCurrency,
  useCurrencySymbolPosition,
  useUploadAvatar,
  useRemoveAvatar,
  useDeleteMyAccount,
  useTwoFactorStatus,
  useSetupTwoFactor,
  useEnableTwoFactor,
  useDisableTwoFactor,
  useRegenerateRecoveryCodes,
} from "../../hooks/useApi";
import {
  amountToCents,
  centsToAmount,
  getCurrencySymbol,
} from "../../utils/currency";
import { FamilySettingsContent } from "../Admin/FamilySettings";
import type { FamilySetting } from "../Admin/FamilySettings";
import AdminUsers from "../Admin/Users";
import ColorFamilySelect from "../../components/Common/ColorFamilySelect";
import {
  DEFAULT_PROJECT_LOGO_SRC,
  isValidHexColor,
  renderIconDataUrl,
  resolveAppIconBackground,
} from "../../utils/branding";

const inputCls =
  "w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm";
const labelCls =
  "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

const settingsCardCls =
  "bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm";
const settingsHeaderCls = "flex items-center gap-2 mb-4";
const settingsTitleCls =
  "text-base font-semibold text-gray-900 dark:text-gray-100";

function SettingsSectionCard({
  icon,
  title,
  action,
  className = "",
  children,
}: {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`${settingsCardCls} ${className}`.trim()}>
      <div className={`${settingsHeaderCls} justify-between gap-3 flex-wrap`}>
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <h2 className={settingsTitleCls}>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

type SettingsPage = "profile" | "password" | "users" | "customization";

export default function Profile() {
  const { t } = useTranslation();
  const { confirm } = useConfirmDialog();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, login, logout, isAdmin } = useAuth();
  const { settings, setLocale, setBranding } = useSettings();
  const updateUser = useUpdateUser();
  const changePassword = useChangePassword();
  const uploadAvatar = useUploadAvatar();
  const removeAvatar = useRemoveAvatar();
  const deleteMyAccount = useDeleteMyAccount();
  const { data: twoFactorStatus } = useTwoFactorStatus();
  const setupTwoFactor = useSetupTwoFactor();
  const enableTwoFactor = useEnableTwoFactor();
  const disableTwoFactor = useDisableTwoFactor();
  const regenerateRecoveryCodes = useRegenerateRecoveryCodes();
  const { data: currentPeriod } = useCurrentPeriod();
  const { data: currency = "NOK" } = useCurrency();
  const { data: symbolPosition = "Before" } = useCurrencySymbolPosition();
  const { data: incomes } = useUserIncomes(currentPeriod?.id ?? "");
  const upsertIncome = useUpsertUserIncome();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const initialTab = searchParams.get("tab") as SettingsPage | "family" | null;
  const normalizedInitialTab =
    initialTab === "family" ? "customization" : initialTab;
  const [activePage, setActivePage] = useState<SettingsPage>(
    normalizedInitialTab &&
      ["profile", "password", "users", "customization"].includes(
        normalizedInitialTab,
      )
      ? (normalizedInitialTab as SettingsPage)
      : "profile",
  );
  const currencySymbol = getCurrencySymbol(currency);
  const [familyPageSize, setFamilyPageSize] = useState(5);

  const [brandingTitle, setBrandingTitle] = useState(
    settings.branding.appTitle,
  );
  const brandingLogoInputRef = useRef<HTMLInputElement>(null);
  const [brandingLogoDataUrl, setBrandingLogoDataUrl] = useState(
    settings.branding.logoDataUrl,
  );
  const [brandingLogoUrl, setBrandingLogoUrl] = useState(
    settings.branding.logoUrl,
  );
  const [brandingLogoUrlError, setBrandingLogoUrlError] = useState("");
  const [brandingPreset, setBrandingPreset] = useState<BrandingPreset>(
    settings.branding.primaryPreset,
  );
  const [brandingAppIconBackground, setBrandingAppIconBackground] = useState(
    settings.branding.appIconBackground,
  );
  const [brandingIconPreviewUrl, setBrandingIconPreviewUrl] = useState(
    DEFAULT_PROJECT_LOGO_SRC,
  );
  const [brandingError, setBrandingError] = useState("");
  const [brandingSaved, setBrandingSaved] = useState(false);
  const [brandingLogoLoadWarning, setBrandingLogoLoadWarning] = useState("");
  const [brandingIconWarning, setBrandingIconWarning] = useState("");

  // Profile form
  const [name, setName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [avatarError, setAvatarError] = useState("");

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  // Danger zone
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");

  // 2FA
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorPassword, setTwoFactorPassword] = useState("");
  const [twoFactorError, setTwoFactorError] = useState("");
  const [setupPayload, setSetupPayload] = useState<{
    secret: string;
    otpauthUrl: string;
    recoveryCodes: string[];
  } | null>(null);

  // Income form
  const myIncome = incomes?.find((i) => i.userId === user?.id);
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeType, setIncomeType] = useState("ANNUAL_GROSS");
  const [incomeError, setIncomeError] = useState("");
  const [incomeSuccess, setIncomeSuccess] = useState(false);

  useEffect(() => {
    if (myIncome) {
      setIncomeAmount(String(centsToAmount(myIncome.inputCents)));
      setIncomeType(myIncome.inputType);
    }
  }, [myIncome?.id]);

  useEffect(() => {
    setBrandingTitle(settings.branding.appTitle);
    setBrandingLogoDataUrl(settings.branding.logoDataUrl);
    setBrandingLogoUrl(settings.branding.logoUrl);
    setBrandingPreset(settings.branding.primaryPreset);
    setBrandingAppIconBackground(settings.branding.appIconBackground);
  }, [settings.branding]);

  useEffect(() => {
    const renderPreview = async () => {
      const logoSrc =
        brandingLogoDataUrl || brandingLogoUrl || DEFAULT_PROJECT_LOGO_SRC;
      const background = resolveAppIconBackground(brandingAppIconBackground);
      try {
        const iconUrl = await renderIconDataUrl(logoSrc, background, 64);
        setBrandingIconPreviewUrl(iconUrl);
        setBrandingIconWarning("");
      } catch {
        try {
          const fallbackIcon = await renderIconDataUrl(
            DEFAULT_PROJECT_LOGO_SRC,
            background,
            64,
          );
          setBrandingIconPreviewUrl(fallbackIcon);
        } catch {
          setBrandingIconPreviewUrl(DEFAULT_PROJECT_LOGO_SRC);
        }
        setBrandingIconWarning(t("settings.brandingIconGenerationFailed"));
      }
    };

    void renderPreview();
  }, [brandingLogoDataUrl, brandingLogoUrl, brandingAppIconBackground]);

  useEffect(() => {
    const tab = searchParams.get("tab") as SettingsPage | "family" | null;
    const normalizedTab = tab === "family" ? "customization" : tab;
    if (
      normalizedTab &&
      ["profile", "password", "users", "customization"].includes(normalizedTab)
    ) {
      setActivePage(normalizedTab as SettingsPage);
    }
  }, [searchParams]);

  const selectPage = (page: SettingsPage) => {
    setActivePage(page);
    const params = new URLSearchParams(searchParams);
    params.set("tab", page);
    setSearchParams(params, { replace: true });
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    setBrandingError("");

    if (
      brandingAppIconBackground &&
      !isValidHexColor(brandingAppIconBackground)
    ) {
      setBrandingError(t("settings.brandingInvalidHex"));
      return;
    }

    if (brandingLogoUrl.trim()) {
      try {
        new URL(brandingLogoUrl.trim());
      } catch {
        setBrandingLogoUrlError(t("settings.brandingInvalidLogoUrl"));
        return;
      }
    }

    setBranding({
      appTitle: brandingTitle.trim() || settings.branding.appTitle,
      logoDataUrl: brandingLogoDataUrl.trim(),
      logoUrl: brandingLogoUrl.trim(),
      primaryPreset: brandingPreset,
      appIconBackground: resolveAppIconBackground(brandingAppIconBackground),
    });
    setBrandingSaved(true);
    window.setTimeout(() => setBrandingSaved(false), 2000);
  };

  const handleBrandingLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !file.type.startsWith("image/") ||
      !/\.(svg|png|jpe?g|webp)$/i.test(file.name)
    ) {
      setBrandingError(t("settings.brandingInvalidImage"));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setBrandingLogoDataUrl(reader.result);
        setBrandingError("");
      }
    };
    reader.onerror = () => setBrandingError(t("settings.brandingInvalidImage"));
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDeleteBrandingLogo = () => {
    setBrandingLogoDataUrl("");
    setBrandingLogoUrl("");
    setBrandingLogoUrlError("");
    setBrandingLogoLoadWarning("");
    setBrandingError("");
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarError("");
    try {
      const updated = await uploadAvatar.mutateAsync({ id: user.id, file });
      login(updated);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setAvatarError(
        Array.isArray(msg) ? msg.join(", ") : msg || t("errors.serverError"),
      );
    }
    e.target.value = "";
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    setAvatarError("");
    try {
      const updated = await removeAvatar.mutateAsync(user.id);
      login(updated);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setAvatarError(
        Array.isArray(msg) ? msg.join(", ") : msg || t("errors.serverError"),
      );
    }
  };

  const handleSaveIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    setIncomeError("");
    setIncomeSuccess(false);
    if (!user || !currentPeriod) return;
    const inputCents = amountToCents(parseFloat(incomeAmount));
    if (isNaN(inputCents) || inputCents <= 0) {
      setIncomeError(t("validation.invalidAmount"));
      return;
    }
    const shouldSaveIncome = await confirm({
      message: t("income.confirmSave"),
      confirmLabel: t("common.confirm"),
    });
    if (!shouldSaveIncome) return;
    try {
      await upsertIncome.mutateAsync({
        userId: user.id,
        periodId: currentPeriod.id,
        inputType: incomeType,
        inputCents,
      });
      setIncomeSuccess(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setIncomeError(
        Array.isArray(msg) ? msg.join(", ") : msg || t("errors.serverError"),
      );
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    if (!user) return;
    try {
      const updatedUser = await updateUser.mutateAsync({
        id: user.id,
        data: {
          name: name.trim(),
          username: username.trim(),
        },
      });
      login(updatedUser);
      setProfileSuccess(t("settings.profileUpdated"));
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setProfileError(
        Array.isArray(msg) ? msg.join(", ") : msg || t("errors.serverError"),
      );
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    if (newPassword !== confirmPassword) {
      setPwError(t("settings.passwordMismatch"));
      return;
    }
    if (newPassword.length < 6) {
      setPwError(t("settings.passwordMinLength"));
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setPwSuccess(t("settings.passwordChanged"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setPwError(
        Array.isArray(msg) ? msg.join(", ") : msg || t("errors.serverError"),
      );
    }
  };

  const handleSetupTwoFactor = async () => {
    setTwoFactorError("");
    try {
      const payload = await setupTwoFactor.mutateAsync();
      setSetupPayload(payload);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setTwoFactorError(
        Array.isArray(msg) ? msg.join(", ") : msg || t("errors.serverError"),
      );
    }
  };

  const handleEnableTwoFactor = async () => {
    setTwoFactorError("");
    try {
      await enableTwoFactor.mutateAsync(twoFactorCode);
      setSetupPayload(null);
      setTwoFactorCode("");
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setTwoFactorError(
        Array.isArray(msg) ? msg.join(", ") : msg || t("errors.serverError"),
      );
    }
  };

  const handleDisableTwoFactor = async () => {
    setTwoFactorError("");
    try {
      await disableTwoFactor.mutateAsync(twoFactorPassword);
      setTwoFactorPassword("");
      setSetupPayload(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setTwoFactorError(
        Array.isArray(msg) ? msg.join(", ") : msg || t("errors.serverError"),
      );
    }
  };

  const handleRegenerateRecoveryCodes = async () => {
    setTwoFactorError("");
    try {
      const payload =
        await regenerateRecoveryCodes.mutateAsync(twoFactorPassword);
      setSetupPayload((prev) =>
        prev
          ? { ...prev, recoveryCodes: payload.recoveryCodes }
          : {
              secret: "",
              otpauthUrl: "",
              recoveryCodes: payload.recoveryCodes,
            },
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setTwoFactorError(
        Array.isArray(msg) ? msg.join(", ") : msg || t("errors.serverError"),
      );
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError("");

    if (deleteConfirmText.trim() !== user?.username) {
      setDeleteError(t("settings.deleteAccountUsernameMismatch"));
      return;
    }

    const shouldDelete = await confirm({
      title: t("common.delete"),
      message: t("settings.deleteAccountFinalConfirm"),
      confirmLabel: t("common.delete"),
      tone: "danger",
    });
    if (!shouldDelete) {
      return;
    }

    try {
      await deleteMyAccount.mutateAsync(deletePassword);
      logout();
      navigate("/login");
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setDeleteError(
        Array.isArray(msg) ? msg.join(", ") : msg || t("errors.serverError"),
      );
    }
  };

  const pageNavItems: {
    key: SettingsPage;
    label: string;
    icon: React.ElementType;
    hidden?: boolean;
  }[] = [
    { key: "profile", label: t("settings.profile"), icon: User },
    { key: "password", label: t("settings.password"), icon: KeyRound },
    { key: "users", label: t("users.title"), icon: Users },
    {
      key: "customization",
      label: t("settings.customization"),
      icon: Palette,
      hidden: !isAdmin,
    },
  ];

  // ---- Avatar block ----
  const AvatarBlock = () => (
    <div className="flex flex-col items-center gap-2 flex-shrink-0">
      <div className="w-20 h-20 rounded-full bg-indigo-500 flex items-center justify-center text-white text-3xl font-semibold overflow-hidden">
        {user?.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          user?.name.charAt(0).toUpperCase()
        )}
      </div>
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFile}
      />
      <div className="flex items-center justify-center gap-2 w-full">
        <button
          type="button"
          onClick={() => avatarInputRef.current?.click()}
          disabled={uploadAvatar.isPending}
          aria-label={
            user?.avatarUrl
              ? t("settings.changePhoto")
              : t("settings.choosePhoto")
          }
          title={
            user?.avatarUrl
              ? t("settings.changePhoto")
              : t("settings.choosePhoto")
          }
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-60"
        >
          {uploadAvatar.isPending ? (
            <span className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Camera size={14} />
          )}
        </button>
        {user?.avatarUrl && (
          <button
            type="button"
            onClick={handleRemoveAvatar}
            disabled={removeAvatar.isPending}
            aria-label={t("settings.removePhoto")}
            title={t("settings.removePhoto")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-60"
          >
            {removeAvatar.isPending ? (
              <span className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        {avatarError && (
          <p className="text-xs text-red-500 dark:text-red-400">
            {avatarError}
          </p>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {t("settings.photoHint")}
        </p>
      </div>
    </div>
  );

  // ---- Income form (reused in Profile view and standalone Income view) ----
  const IncomeFormContent = () => (
    <>
      {!currentPeriod && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {t("income.noPeriod")}
        </p>
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
              <span>{t("income.saved")}</span>
            </div>
          )}
          <form
            id="income-form"
            onSubmit={handleSaveIncome}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">
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
                <div className="relative flex items-center">
                  {symbolPosition === "Before" && (
                    <span className="pointer-events-none absolute left-3 inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                      {currencySymbol}
                    </span>
                  )}
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={incomeAmount}
                    onChange={(e) => setIncomeAmount(e.target.value)}
                    className={`${inputCls} text-right ${symbolPosition === "Before" ? "pl-14 pr-3" : "pr-14 pl-3"}`}
                    placeholder="0.00"
                    required
                  />
                  {symbolPosition === "After" && (
                    <span className="pointer-events-none absolute right-3 inline-flex items-center text-sm font-medium text-gray-500 dark:text-gray-400">
                      {currencySymbol}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t("income.autoConverted")}
              </p>
            </div>
          </form>
        </>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {t("settings.title")}
      </h1>

      <div className="max-w-sm">
        <label className={labelCls}>{t("settings.section")}</label>
        <select
          value={activePage}
          onChange={(e) => selectPage(e.target.value as SettingsPage)}
          className={inputCls}
        >
          {pageNavItems
            .filter((item) => !item.hidden)
            .map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
        </select>
      </div>

      <div
        className={`grid grid-cols-1 gap-4 items-start ${activePage === "profile" ? "lg:grid-cols-2" : ""}`}
      >
        <div
          className={`min-w-0 lg:col-span-2 grid grid-cols-1 gap-4 ${activePage === "profile" ? "lg:grid-cols-2" : ""}`}
        >
          {/* ---- Profile section: avatar-left + income alongside on desktop ---- */}
          {activePage === "profile" && (
            <div className="space-y-4 lg:contents">
              {/* Profile card with avatar-left layout */}
              <SettingsSectionCard
                icon={
                  <User
                    size={18}
                    className="text-indigo-500 dark:text-indigo-400"
                  />
                }
                title={t("settings.profile")}
                action={
                  <button
                    type="submit"
                    form="profile-form"
                    disabled={updateUser.isPending}
                    className="h-11 px-4 inline-flex items-center gap-2 text-sm font-semibold bg-indigo-500 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg transition-colors"
                  >
                    {updateUser.isPending && (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {t("common.save")}
                  </button>
                }
              >
                <div className="grid grid-cols-1 min-[380px]:grid-cols-[minmax(96px,1fr)_minmax(0,2fr)] gap-4 items-start">
                  <AvatarBlock />

                  <div className="flex-1 min-w-0">
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
                    <form
                      id="profile-form"
                      onSubmit={handleProfileSubmit}
                      className="space-y-4"
                    >
                      <div>
                        <label className={labelCls}>{t("users.name")}</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className={inputCls}
                          required
                        />
                      </div>
                      <div>
                        <label className={labelCls}>
                          {t("users.username")}
                        </label>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className={inputCls}
                          required
                        />
                      </div>
                    </form>
                  </div>
                </div>
              </SettingsSectionCard>
            </div>
          )}

          {activePage === "profile" && (
            <SettingsSectionCard
              icon={
                <TrendingUp
                  size={18}
                  className="text-indigo-500 dark:text-indigo-400"
                />
              }
              title={t("settings.myIncome")}
              action={
                <button
                  type="submit"
                  form="income-form"
                  disabled={upsertIncome.isPending || !currentPeriod}
                  className="h-11 px-4 inline-flex items-center gap-2 text-sm font-semibold bg-indigo-500 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg transition-colors"
                >
                  {upsertIncome.isPending && (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {t("income.saveButton")}
                </button>
              }
            >
              <IncomeFormContent />
            </SettingsSectionCard>
          )}

          {/* Language section */}
          {activePage === "profile" && (
            <SettingsSectionCard
              icon={
                <Globe
                  size={18}
                  className="text-indigo-500 dark:text-indigo-400"
                />
              }
              title={t("settings.language")}
            >
              <div className="space-y-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("settings.languageDescription")}
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setLocale("en")}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                      settings.locale === "en"
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                        : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span className="text-base leading-none">🇬🇧</span>
                    {t("settings.english")}
                    {settings.locale === "en" && (
                      <CheckCircle2
                        size={15}
                        className="ml-auto text-indigo-500 dark:text-indigo-400"
                      />
                    )}
                  </button>
                  <button
                    onClick={() => setLocale("nb")}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                      settings.locale === "nb"
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                        : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span className="text-base leading-none">🇳🇴</span>
                    {t("settings.norwegian")}
                    {settings.locale === "nb" && (
                      <CheckCircle2
                        size={15}
                        className="ml-auto text-indigo-500 dark:text-indigo-400"
                      />
                    )}
                  </button>
                </div>
              </div>
            </SettingsSectionCard>
          )}

          {/* Change password section */}
          {activePage === "password" && (
            <SettingsSectionCard
              icon={
                <KeyRound
                  size={18}
                  className="text-indigo-500 dark:text-indigo-400"
                />
              }
              title={t("settings.changePassword")}
              action={
                <button
                  type="submit"
                  form="password-form"
                  disabled={changePassword.isPending}
                  className="h-11 px-4 inline-flex items-center gap-2 text-sm font-semibold bg-indigo-500 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg transition-colors"
                >
                  {changePassword.isPending && (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {t("settings.changePassword")}
                </button>
              }
            >
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

              <form
                id="password-form"
                onSubmit={handlePasswordSubmit}
                className="space-y-4"
              >
                <div>
                  <label className={labelCls}>
                    {t("settings.currentPassword")}
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    {t("settings.newPassword")}
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={inputCls}
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    {t("settings.confirmPassword")}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputCls}
                    required
                    minLength={6}
                  />
                </div>
              </form>
            </SettingsSectionCard>
          )}

          {/* Two-factor authentication */}
          {activePage === "password" && (
            <SettingsSectionCard
              icon={
                <ShieldCheck
                  size={18}
                  className="text-indigo-500 dark:text-indigo-400"
                />
              }
              title={t("settings.twoFactorTitle")}
            >
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                {twoFactorStatus?.enabled
                  ? t("settings.twoFactorEnabled")
                  : t("settings.twoFactorDisabled")}
              </p>

              {twoFactorError && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm mb-4">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  <span>{twoFactorError}</span>
                </div>
              )}

              {!twoFactorStatus?.enabled && !setupPayload && (
                <button
                  type="button"
                  onClick={handleSetupTwoFactor}
                  className="px-4 py-2 text-sm font-semibold bg-indigo-500 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  {t("settings.setupTwoFactor")}
                </button>
              )}

              {setupPayload && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {t("settings.twoFactorSecret")}:{" "}
                    <span className="font-mono">{setupPayload.secret}</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 break-all">
                    {setupPayload.otpauthUrl}
                  </p>
                  <div>
                    <label className={labelCls}>
                      {t("settings.twoFactorCode")}
                    </label>
                    <input
                      type="text"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      className={inputCls}
                      placeholder="123456"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleEnableTwoFactor}
                    className="px-4 py-2 text-sm font-semibold bg-green-500 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    {t("settings.enableTwoFactor")}
                  </button>
                  {setupPayload.recoveryCodes.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {t("settings.recoveryCodes")}
                      </p>
                      <div className="grid grid-cols-2 gap-1 text-xs font-mono text-gray-700 dark:text-gray-300">
                        {setupPayload.recoveryCodes.map((code) => (
                          <span key={code}>{code}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {twoFactorStatus?.enabled && (
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>
                      {t("settings.currentPassword")}
                    </label>
                    <input
                      type="password"
                      value={twoFactorPassword}
                      onChange={(e) => setTwoFactorPassword(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleRegenerateRecoveryCodes}
                      className="px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200"
                    >
                      {t("settings.regenerateRecoveryCodes")}
                    </button>
                    <button
                      type="button"
                      onClick={handleDisableTwoFactor}
                      className="px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      {t("settings.disableTwoFactor")}
                    </button>
                  </div>
                </div>
              )}
            </SettingsSectionCard>
          )}

          {activePage === "users" && (
            <div className={`${settingsCardCls} w-full`}>
              <AdminUsers embedded />
            </div>
          )}

          {/* Danger zone */}
          {activePage === "password" && (
            <SettingsSectionCard
              icon={
                <AlertCircle
                  size={18}
                  className="text-red-700 dark:text-red-400"
                />
              }
              title={t("settings.deleteAccountTitle")}
              className="border-red-200 dark:border-red-900"
            >
              <p className="text-sm text-gray-500 dark:text-gray-300 mb-4">
                {t("settings.deleteAccountWarning")}
              </p>

              {deleteError && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm mb-4">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <form onSubmit={handleDeleteAccount} className="space-y-4">
                <div>
                  <label className={labelCls}>
                    {t("settings.currentPassword")}
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    {t("settings.deleteAccountTypeUsername", {
                      username: user?.username ?? "",
                    })}
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className={inputCls}
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={deleteMyAccount.isPending}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg transition-colors"
                  >
                    {deleteMyAccount.isPending && (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {t("settings.deleteAccountAction")}
                  </button>
                </div>
              </form>
            </SettingsSectionCard>
          )}

          {/* Family settings sections (admin only) */}
          {activePage === "customization" && isAdmin && (
            <FamilySettingsContent
              activeSection={"currency" as FamilySetting}
              pageSize={familyPageSize}
              onPageSizeChange={setFamilyPageSize}
            />
          )}

          {activePage === "customization" && isAdmin && (
            <SettingsSectionCard
              icon={<Palette size={18} className="text-primary" />}
              title={t("settings.brandingTitle")}
            >
              <form onSubmit={handleSaveBranding} className="space-y-4">
                <div>
                  <label className={labelCls}>
                    {t("settings.brandingAppTitle")}
                  </label>
                  <input
                    type="text"
                    value={brandingTitle}
                    onChange={(e) => setBrandingTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-focus focus:border-transparent text-sm"
                    placeholder={t("app.title")}
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>
                    {t("settings.brandingLogo")}
                  </label>
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        brandingLogoDataUrl ||
                        brandingLogoUrl ||
                        DEFAULT_PROJECT_LOGO_SRC
                      }
                      alt={t("settings.brandingLogoPreviewAlt")}
                      className="w-12 h-12 object-contain"
                      onError={(event) => {
                        if (brandingLogoUrl) {
                          setBrandingLogoLoadWarning(
                            t("settings.brandingLogoLoadFailed"),
                          );
                        }
                        event.currentTarget.src = DEFAULT_PROJECT_LOGO_SRC;
                      }}
                      onLoad={() => setBrandingLogoLoadWarning("")}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => brandingLogoInputRef.current?.click()}
                        className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium bg-primary text-white hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                      >
                        {brandingLogoDataUrl || brandingLogoUrl
                          ? t("settings.brandingReplaceLogo")
                          : t("settings.brandingUploadLogo")}
                      </button>
                      {(brandingLogoDataUrl || brandingLogoUrl) && (
                        <button
                          type="button"
                          onClick={handleDeleteBrandingLogo}
                          className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium border border-border text-text-secondary hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                        >
                          {t("settings.brandingDeleteLogo")}
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    ref={brandingLogoInputRef}
                    type="file"
                    accept=".svg,.png,.jpg,.jpeg,.webp,image/svg+xml,image/png,image/jpeg,image/webp"
                    onChange={handleBrandingLogoFile}
                    className="hidden"
                  />
                  <div>
                    <label className={labelCls}>
                      {t("settings.brandingLogoUrl")}
                    </label>
                    <input
                      type="url"
                      value={brandingLogoUrl}
                      onChange={(e) => {
                        setBrandingLogoUrl(e.target.value);
                        setBrandingLogoUrlError("");
                      }}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-focus focus:border-transparent text-sm"
                      placeholder="https://example.com/logo.svg"
                    />
                    {brandingLogoUrlError && (
                      <p className="text-xs text-danger mt-1">
                        {brandingLogoUrlError}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary">
                    {brandingLogoDataUrl || brandingLogoUrl
                      ? t("settings.brandingCustomLogoActive")
                      : t("settings.brandingDefaultLogoActive")}
                  </p>
                  {brandingLogoLoadWarning && (
                    <p className="text-xs text-warning">
                      {brandingLogoLoadWarning}
                    </p>
                  )}
                </div>
                <ColorFamilySelect
                  value={brandingPreset}
                  onChange={(next) => setBrandingPreset(next as BrandingPreset)}
                  label={t("settings.brandingPrimaryPreset")}
                />
                <div>
                  <label className={labelCls}>
                    {t("settings.brandingAppIconBackground")}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={resolveAppIconBackground(
                        brandingAppIconBackground,
                      )}
                      onChange={(e) =>
                        setBrandingAppIconBackground(
                          e.target.value.toUpperCase(),
                        )
                      }
                      className="h-10 w-12 rounded border border-border bg-surface p-1 focus:outline-none focus:ring-2 focus:ring-focus"
                      aria-label={t("settings.brandingAppIconBackground")}
                    />
                    <span className="text-sm text-text-secondary">
                      {resolveAppIconBackground(brandingAppIconBackground)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-text-secondary">
                    {t("settings.brandingAppIconPreview")}
                  </span>
                  <img
                    src={brandingIconPreviewUrl}
                    alt={t("settings.brandingAppIconPreview")}
                    className="w-10 h-10 rounded-md border border-border bg-surface-elevated object-contain"
                  />
                </div>
                {brandingIconWarning && (
                  <p className="text-xs text-warning">{brandingIconWarning}</p>
                )}
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-text-secondary">
                    {t("settings.brandingHelp")}
                  </p>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold bg-primary text-white hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    {t("common.save")}
                  </button>
                </div>
                {brandingError && (
                  <p className="text-xs text-danger">{brandingError}</p>
                )}
                {brandingSaved && (
                  <p className="text-xs text-success">
                    {t("settings.profileUpdated")}
                  </p>
                )}
              </form>
            </SettingsSectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
