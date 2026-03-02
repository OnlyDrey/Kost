import { useState, useEffect, useMemo } from "react";
import {
  useNavigate,
  useParams,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  useCreateInvoice,
  useUpdateInvoice,
  useCreateSubscription,
  useUpdateSubscription,
  useCurrentPeriod,
  usePeriod,
  useUsers,
  useInvoice,
  useSubscription,
  useUserIncomes,
  useCategories,
  usePaymentMethods,
  useVendors,
  useCurrency,
  useCurrencySymbolPosition,
} from "../../hooks/useApi";
import {
  amountToCents,
  centsToAmount,
  getCurrencySymbol,
} from "../../utils/currency";
import UserSelectionCards from "../../components/Distribution/UserSelectionCards";
import UserSingleSelect from "../../components/Distribution/UserSingleSelect";
import { useAuth } from "../../stores/auth.context";
import { isPeriodClosed } from "../../utils/periodStatus";

const inputCls =
  "w-full px-3.5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm";
const dateInputCls = `${inputCls} w-full min-w-0 max-w-full box-border appearance-none`;

const labelCls =
  "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

export default function AddExpense() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Determine type from URL pathname
  const isSubscription = location.pathname.includes("/subscriptions/");
  const isEditing = !!id && !["add"].includes(id);

  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const createSubscription = useCreateSubscription();
  const updateSubscription = useUpdateSubscription();

  const { data: currentPeriod } = useCurrentPeriod();
  const selectedPeriodId = searchParams.get("period") ?? "";
  const { data: selectedPeriod } = usePeriod(selectedPeriodId);
  const targetPeriodId = selectedPeriodId || currentPeriod?.id || "";
  const targetPeriodClosed = selectedPeriod
    ? isPeriodClosed(selectedPeriod)
    : false;

  const { data: users } = useUsers();
  const { data: existingInvoice } = useInvoice(
    isEditing && !isSubscription ? id! : "",
  );
  const { data: existingSubscription } = useSubscription(
    isEditing && isSubscription ? id! : "",
  );
  const { data: periodIncomes } = useUserIncomes(targetPeriodId);
  const { data: categories = [] } = useCategories();
  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })),
    [categories],
  );
  const { data: paymentMethods = [] } = usePaymentMethods();
  const { data: vendors = [] } = useVendors();
  const { data: currency = "NOK" } = useCurrency();
  const { data: symbolPosition = "Before" } = useCurrencySymbolPosition();

  const currencySymbol = useMemo(() => getCurrencySymbol(currency), [currency]);

  const [vendor, setVendor] = useState("");
  const [showVendorList, setShowVendorList] = useState(false);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [amount, setAmount] = useState("");
  const [distributionMethod, setDistributionMethod] = useState<
    "BY_INCOME" | "BY_PERCENT" | "FIXED" | "PERSONAL"
  >("BY_INCOME");
  const [fixedMode, setFixedMode] = useState<"EQUAL" | "AMOUNT">("EQUAL");
  const [dueDate, setDueDate] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [frequency, setFrequency] = useState("MONTHLY");
  const [frequencyQuantity, setFrequencyQuantity] = useState("1");
  const [frequencyUnit, setFrequencyUnit] = useState("MONTH");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [nextBillingAt, setNextBillingAt] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState<
    "ACTIVE" | "PAUSED" | "CANCELED"
  >("ACTIVE");
  const [personalUserId, setPersonalUserId] = useState("");
  const [error, setError] = useState("");
  const [userPercents, setUserPercents] = useState<Record<string, string>>({});
  const [userFixedAmounts, setUserFixedAmounts] = useState<
    Record<string, string>
  >({});
  const [incomeUserIds, setIncomeUserIds] = useState<Set<string>>(new Set());

  // Default selection for participant-based distribution
  useEffect(() => {
    if (!users || users.length === 0 || isEditing) return;
    setIncomeUserIds(new Set());
  }, [users, isEditing, isSubscription]);

  // Pre-fill form when editing invoice
  useEffect(() => {
    if (isEditing && !isSubscription && existingInvoice) {
      setVendor(existingInvoice.vendor);
      setDescription(existingInvoice.description ?? "");
      setCategory(existingInvoice.category);
      setAmount(String(centsToAmount(existingInvoice.totalCents)));
      setDistributionMethod(existingInvoice.distributionMethod);
      setPaymentMethod(existingInvoice.paymentMethod ?? "");
      if (existingInvoice.dueDate)
        setDueDate(existingInvoice.dueDate.slice(0, 10));
      setPersonalUserId(existingInvoice.ownerUserId ?? "");

      const rules = existingInvoice.distribution as any;
      if (rules?.userIds && Array.isArray(rules.userIds)) {
        setIncomeUserIds(new Set(rules.userIds));
      } else if (existingInvoice.shares && existingInvoice.shares.length > 0) {
        setIncomeUserIds(
          new Set(existingInvoice.shares.map((s: any) => s.userId)),
        );
      } else {
        setIncomeUserIds(new Set());
      }

      if (existingInvoice.distributionMethod === "BY_PERCENT") {
        const percents: Record<string, string> = {};
        if (rules?.percentRules && Array.isArray(rules.percentRules)) {
          rules.percentRules.forEach((rule: any) => {
            percents[rule.userId] = (rule.percentBasisPoints / 100).toFixed(1);
          });
        } else if (existingInvoice.shares && existingInvoice.totalCents > 0) {
          existingInvoice.shares.forEach((share: any) => {
            const percentage = (
              (share.shareCents / existingInvoice.totalCents) *
              100
            ).toFixed(1);
            percents[share.userId] = percentage;
          });
        }
        setUserPercents(percents);
      } else {
        setUserPercents({});
      }

      if (rules?.fixedRules && Array.isArray(rules.fixedRules)) {
        const fixedAmounts: Record<string, string> = {};
        rules.fixedRules.forEach((rule: any) => {
          fixedAmounts[rule.userId] = String(centsToAmount(rule.fixedCents));
        });
        setUserFixedAmounts(fixedAmounts);
        setFixedMode("AMOUNT");
      } else {
        setUserFixedAmounts({});
        if (existingInvoice.distributionMethod === "FIXED") {
          setFixedMode("EQUAL");
        }
      }
    }
  }, [isEditing, existingInvoice?.id, isSubscription]);

  // Parse frequency string into quantity and unit
  const parseFrequency = (freq: string) => {
    const match = freq.match(/^(\d+)_(\w+)$/);
    if (match) {
      return { quantity: match[1], unit: match[2] };
    }
    // Handle standard frequencies
    if (freq === "DAILY") return { quantity: "1", unit: "DAY" };
    if (freq === "WEEKLY") return { quantity: "1", unit: "WEEK" };
    if (freq === "MONTHLY") return { quantity: "1", unit: "MONTH" };
    if (freq === "QUARTERLY") return { quantity: "3", unit: "MONTH" };
    if (freq === "YEARLY") return { quantity: "1", unit: "YEAR" };
    return { quantity: "1", unit: "MONTH" };
  };

  // Calculate frequency string from quantity and unit
  const calculateFrequency = (quantity: string, unit: string) => {
    const q = parseInt(quantity) || 1;
    if (q === 1 && unit === "DAY") return "DAILY";
    if (q === 1 && unit === "WEEK") return "WEEKLY";
    if (q === 1 && unit === "MONTH") return "MONTHLY";
    if (q === 3 && unit === "MONTH") return "QUARTERLY";
    if (q === 1 && unit === "YEAR") return "YEARLY";
    return `${q}_${unit}`;
  };

  // Pre-fill form when editing subscription
  useEffect(() => {
    if (isEditing && isSubscription && existingSubscription) {
      setVendor(existingSubscription.vendor);
      setDescription(existingSubscription.description || "");
      setCategory(existingSubscription.category ?? "");
      setAmount(String(centsToAmount(existingSubscription.amountCents)));
      setDistributionMethod(existingSubscription.distributionMethod as any);
      setPersonalUserId((existingSubscription as any).personalUserId ?? "");
      if (existingSubscription.distributionMethod !== "FIXED") {
        setFixedMode("EQUAL");
      }
      setStartDate(existingSubscription.startDate.slice(0, 10));
      setFrequency(existingSubscription.frequency);
      const parsed = parseFrequency(existingSubscription.frequency);
      setFrequencyQuantity(parsed.quantity);
      setFrequencyUnit(parsed.unit);
      setDayOfMonth(String(existingSubscription.dayOfMonth ?? 1));
      setNextBillingAt(
        existingSubscription.nextBillingAt
          ? existingSubscription.nextBillingAt.slice(0, 10)
          : "",
      );
      setSubscriptionStatus(
        existingSubscription.status ??
          (existingSubscription.active ? "ACTIVE" : "PAUSED"),
      );

      // Initialize distribution rules from subscription
      const rules = existingSubscription.distributionRules as any;
      if (rules) {
        // Load user IDs if present
        if (
          rules.userIds &&
          Array.isArray(rules.userIds) &&
          rules.userIds.length > 0
        ) {
          setIncomeUserIds(new Set(rules.userIds));
        } else if (
          rules.percentRules &&
          Array.isArray(rules.percentRules) &&
          rules.percentRules.length > 0
        ) {
          setIncomeUserIds(
            new Set(rules.percentRules.map((rule: any) => rule.userId)),
          );
        } else {
          setIncomeUserIds(new Set());
        }

        // Load percentage rules if present
        if (rules.percentRules && Array.isArray(rules.percentRules)) {
          const percents: Record<string, string> = {};
          rules.percentRules.forEach((rule: any) => {
            percents[rule.userId] = (rule.percentBasisPoints / 100).toFixed(1);
          });
          setUserPercents(percents);
        } else {
          setUserPercents({});
        }

        if (
          rules.fixedRules &&
          Array.isArray(rules.fixedRules) &&
          rules.fixedRules.length > 0
        ) {
          const fixedAmounts: Record<string, string> = {};
          rules.fixedRules.forEach((rule: any) => {
            fixedAmounts[rule.userId] = String(centsToAmount(rule.fixedCents));
          });
          setUserFixedAmounts(fixedAmounts);
          setFixedMode("AMOUNT");
        } else {
          setUserFixedAmounts({});
          if (existingSubscription.distributionMethod === "FIXED")
            setFixedMode("EQUAL");
        }
      } else {
        // No distribution rules - keep empty and let the user explicitly select participants
        setIncomeUserIds(new Set());
        setUserPercents({});
        setUserFixedAmounts({});
      }
    }
  }, [
    isEditing,
    isSubscription,
    existingSubscription?.id,
    existingSubscription?.updatedAt,
  ]);

  const customAmountTotalCents = Object.entries(userPercents).reduce(
    (sum, [userId, value]) =>
      incomeUserIds.has(userId)
        ? sum + amountToCents(parseFloat(value) || 0)
        : sum,
    0,
  );
  const fixedTotalCents = Object.values(userFixedAmounts).reduce(
    (sum, value) => sum + amountToCents(parseFloat(value || "0")),
    0,
  );
  const enteredTotalCents = amountToCents(parseFloat(amount || "0"));
  const fixedRemainingCents = enteredTotalCents - fixedTotalCents;

  // Calculate income percentages for BY_INCOME display
  const activeIncomes = periodIncomes
    ? periodIncomes.filter(
        (i) => incomeUserIds.has(i.userId) && i.normalizedMonthlyGrossCents > 0,
      )
    : [];
  const totalIncome = activeIncomes.reduce(
    (sum, i) => sum + i.normalizedMonthlyGrossCents,
    0,
  );
  const incomePercent = (userId: string) => {
    const inc = activeIncomes.find((i) => i.userId === userId);
    if (!inc || totalIncome === 0) return null;
    return ((inc.normalizedMonthlyGrossCents / totalIncome) * 100).toFixed(1);
  };

  const participantUserIds = Array.from(incomeUserIds);
  const fixedAmountUserIds = Object.entries(userFixedAmounts)
    .filter(([, value]) => amountToCents(parseFloat(value || "0")) > 0)
    .map(([userId]) => userId);

  const selectedUserIds =
    distributionMethod === "PERSONAL"
      ? personalUserId
        ? [personalUserId]
        : []
      : distributionMethod === "FIXED" && fixedMode === "AMOUNT"
        ? fixedAmountUserIds
        : participantUserIds;

  const equalPercent =
    distributionMethod === "FIXED" && fixedMode === "EQUAL"
      ? selectedUserIds.length > 0
        ? (100 / selectedUserIds.length).toFixed(1)
        : null
      : null;

  const handleToggleIncomeUser = (userId: string) => {
    setIncomeUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isEditing && !isSubscription && !targetPeriodId) {
      setError(t("invoice.noPeriodWarning"));
      return;
    }
    if (!isEditing && !isSubscription && targetPeriodClosed) {
      setError(t("invoice.closedPeriodAddBlocked"));
      return;
    }
    if (distributionMethod === "PERSONAL" && !personalUserId) {
      setError(t("invoice.selectPersonalUser"));
      return;
    }

    if (!vendor.trim()) {
      setError(t("validation.required"));
      return;
    }

    const totalCents = amountToCents(parseFloat(amount));
    if (isNaN(totalCents) || totalCents <= 0) {
      setError(t("validation.invalidAmount"));
      return;
    }

    let distributionRules:
      | {
          percentRules?: Array<{ userId: string; percentBasisPoints: number }>;
          fixedRules?: Array<{ userId: string; fixedCents: number }>;
          remainderMethod?: "EQUAL" | "BY_INCOME";
          userIds?: string[];
        }
      | undefined;

    if (distributionMethod === "BY_PERCENT") {
      const amountRules = Object.entries(userPercents)
        .filter(
          ([userId, v]) =>
            selectedUserIds.includes(userId) &&
            amountToCents(parseFloat(v)) > 0,
        )
        .map(([userId, v]) => ({
          userId,
          amountCents: amountToCents(parseFloat(v)),
        }));

      if (amountRules.length === 0) {
        setError(t("subscription.fixedAmountPerUser"));
        return;
      }

      const totalCustom = amountRules.reduce(
        (sum, rule) => sum + rule.amountCents,
        0,
      );
      if (totalCustom <= 0) {
        setError(t("validation.invalidAmount"));
        return;
      }

      const percentRules = amountRules.map((rule) => ({
        userId: rule.userId,
        percentBasisPoints: Math.round(
          (rule.amountCents / totalCustom) * 10000,
        ),
      }));
      distributionRules = { percentRules, userIds: selectedUserIds };
    }

    if (distributionMethod === "FIXED" && fixedMode === "AMOUNT") {
      const fixedRules = selectedUserIds
        .map((userId) => ({
          userId,
          fixedCents: amountToCents(
            parseFloat(userFixedAmounts[userId] || "0"),
          ),
        }))
        .filter((rule) => rule.fixedCents > 0);

      if (fixedTotalCents > totalCents) {
        setError(t("validation.invalidAmount"));
        return;
      }

      distributionRules = {
        ...(distributionRules ?? {}),
        fixedRules,
        remainderMethod: "EQUAL",
        userIds: selectedUserIds,
      };
    }

    // Always include userIds for methods that rely on selected users, even if empty (validated below)
    if (
      distributionMethod === "BY_INCOME" ||
      distributionMethod === "FIXED" ||
      distributionMethod === "BY_PERCENT"
    ) {
      const userIds = selectedUserIds;
      distributionRules = { ...(distributionRules ?? {}), userIds };

      if (userIds.length === 0) {
        setError(t("invoice.atLeastOneUser"));
        return;
      }
    }

    try {
      if (isSubscription) {
        const actualFrequency = calculateFrequency(
          frequencyQuantity,
          frequencyUnit,
        );

        const subData: any = {
          name: vendor.trim(),
          vendor: vendor.trim(),
          category: category.trim() || undefined,
          description: description.trim() || undefined,
          amountCents: totalCents,
          distributionMethod,
          paymentMethod: paymentMethod || undefined,
          personalUserId:
            distributionMethod === "PERSONAL" ? personalUserId : undefined,
          frequency: actualFrequency,
          dayOfMonth: parseInt(dayOfMonth) || undefined,
          startDate,
          status: subscriptionStatus,
          nextBillingAt: nextBillingAt || undefined,
          distributionRules: distributionRules || {},
        };

        if (isEditing) {
          await updateSubscription.mutateAsync({ id: id!, data: subData });
        } else {
          await createSubscription.mutateAsync(subData);
        }
        navigate("/subscriptions");
      } else {
        const invoiceData: any = {
          vendor: vendor.trim(),
          totalCents,
          distributionMethod,
          paymentMethod: paymentMethod || undefined,
          personalUserId:
            distributionMethod === "PERSONAL" ? personalUserId : undefined,
        };
        if (category.trim()) invoiceData.category = category.trim();
        if (description.trim()) invoiceData.description = description.trim();
        if (dueDate) invoiceData.dueDate = dueDate;
        if (paymentMethod) invoiceData.paymentMethod = paymentMethod;
        if (distributionRules)
          invoiceData.distributionRules = distributionRules;

        if (isEditing) {
          await updateInvoice.mutateAsync({ id: id!, data: invoiceData });
        } else {
          await createInvoice.mutateAsync({
            periodId: targetPeriodId,
            ...invoiceData,
          });
        }
        navigate("/invoices");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(
        Array.isArray(msg) ? msg.join(", ") : msg || t("errors.serverError"),
      );
    }
  };

  const isPending =
    createInvoice.isPending ||
    updateInvoice.isPending ||
    createSubscription.isPending ||
    updateSubscription.isPending;

  const backUrl = isSubscription
    ? "/subscriptions"
    : selectedPeriodId
      ? `/overview?period=${selectedPeriodId}`
      : "/invoices";
  const titleKey = isSubscription
    ? isEditing
      ? "subscription.edit"
      : "subscription.add"
    : isEditing
      ? "invoice.editInvoice"
      : "invoice.addInvoice";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(backUrl)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t(titleKey)}
          </h1>
        </div>
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(backUrl)}
            className="px-3.5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            form="expense-form"
            disabled={
              isPending ||
              (!isEditing && !isSubscription && !targetPeriodId) ||
              (!isEditing && !isSubscription && targetPeriodClosed)
            }
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold bg-primary hover:bg-primary/90 disabled:opacity-60 text-white rounded-lg transition-colors"
          >
            {isPending && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {t("common.save")}
          </button>
        </div>
      </div>

      {!isEditing && !isSubscription && !targetPeriodId && (
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-lg px-4 py-3 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{t("invoice.noPeriodWarning")}</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm ">
        <form id="expense-form" onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="relative grid grid-cols-1 lg:grid-cols-2 lg:gap-8 gap-5">
            <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-gray-200 dark:bg-gray-800 lg:block" />
            {isSubscription && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 md:gap-6 lg:col-start-1">
                <div className="min-w-0">
                  <label className={labelCls}>{t("subscription.status")}</label>
                  <select
                    value={subscriptionStatus}
                    onChange={(e) =>
                      setSubscriptionStatus(
                        e.target.value as "ACTIVE" | "PAUSED" | "CANCELED",
                      )
                    }
                    className={inputCls}
                  >
                    <option value="ACTIVE">
                      {t("subscription.statusActive")}
                    </option>
                    <option value="PAUSED">
                      {t("subscription.statusPaused")}
                    </option>
                    <option value="CANCELED">
                      {t("subscription.statusCanceled")}
                    </option>
                  </select>
                </div>
                <div className="min-w-0">
                  <label className={labelCls}>
                    {t("subscription.nextBillingAt")}
                  </label>
                  <input
                    type="date"
                    value={nextBillingAt}
                    onChange={(e) => setNextBillingAt(e.target.value)}
                    className={dateInputCls}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 md:gap-6 lg:col-start-1">
              <div className="relative">
                <label className={labelCls}>{t("invoice.vendor")} *</label>
                <input
                  type="text"
                  value={vendor}
                  onChange={(e) => {
                    setVendor(e.target.value);
                    setShowVendorList(true);
                  }}
                  onFocus={() => setShowVendorList(true)}
                  onBlur={() => setTimeout(() => setShowVendorList(false), 150)}
                  required
                  className={inputCls}
                  placeholder={t("invoice.vendorPlaceholder")}
                />
                {showVendorList && vendors.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-44 overflow-y-auto">
                    {vendors
                      .filter((v) =>
                        v.name.toLowerCase().includes(vendor.toLowerCase()),
                      )
                      .map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onMouseDown={() => {
                            setVendor(v.name);
                            setShowVendorList(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-left"
                        >
                          {v.logoUrl && (
                            <img
                              src={v.logoUrl}
                              alt=""
                              className="w-5 h-5 rounded object-contain bg-white flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          )}
                          <span>{v.name}</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
              <div>
                <label className={labelCls}>{t("invoice.category")}</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputCls}
                >
                  <option value="">{t("invoice.categoryPlaceholder")}</option>
                  {sortedCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="lg:col-start-1 lg:pr-6">
              <label className={labelCls}>{t("invoice.description")}</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputCls}
                placeholder={
                  isSubscription
                    ? t("subscription.descriptionPlaceholder")
                    : t("invoice.descriptionPlaceholder")
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 md:gap-6 lg:col-start-1 lg:pr-6">
              <div className="min-w-0">
                <label className={labelCls}>{t("invoice.amount")} *</label>
                <div className="relative flex items-center">
                  {symbolPosition === "Before" && (
                    <span className="absolute left-3.5 text-sm text-gray-500 dark:text-gray-400 pointer-events-none select-none">
                      {currencySymbol}
                    </span>
                  )}
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    step="0.01"
                    min="0"
                    className={`${inputCls} text-right ${symbolPosition === "Before" ? "pl-8" : "pr-8"}`}
                    placeholder="0.00"
                  />
                  {symbolPosition === "After" && (
                    <span className="absolute right-3.5 text-sm text-gray-500 dark:text-gray-400 pointer-events-none select-none">
                      {currencySymbol}
                    </span>
                  )}
                </div>
              </div>
              <div className="min-w-0">
                <label className={labelCls}>{t("invoice.paymentMethod")}</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className={inputCls}
                >
                  <option value="">{t("invoice.paymentMethodPlaceholder")}</option>
                  {paymentMethods.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!isSubscription && (
              <div className="lg:col-start-1 lg:pr-6">
                <label className={labelCls}>{t("invoice.dueDate")}</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={dateInputCls}
                />
              </div>
            )}

            {isSubscription && (
              <>
                <div className="lg:col-start-2 lg:pl-6">
                  <label className={labelCls}>{t("subscription.startDate")}</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={dateInputCls}
                  />
                </div>

                <div className="space-y-4 lg:col-start-2 lg:pl-6">
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label className={labelCls}>{t("subscription.everyLabel")}</label>
                      <input
                        type="number"
                        value={frequencyQuantity}
                        onChange={(e) => setFrequencyQuantity(e.target.value)}
                        className={inputCls}
                        min="1"
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>{t("subscription.frequencyLabel")}</label>
                      <select
                        value={frequencyUnit}
                        onChange={(e) => setFrequencyUnit(e.target.value)}
                        className={inputCls}
                      >
                        <option value="DAY">{t("subscription.unitDay")}</option>
                        <option value="WEEK">{t("subscription.unitWeek")}</option>
                        <option value="MONTH">{t("subscription.unitMonth")}</option>
                        <option value="YEAR">{t("subscription.unitYear")}</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>{t("subscription.dayOfMonth")}</label>
                    <input
                      type="number"
                      value={dayOfMonth}
                      onChange={(e) => setDayOfMonth(e.target.value)}
                      className={inputCls}
                      min="1"
                      max="31"
                      placeholder="1"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="lg:col-start-2 lg:pl-6 lg:self-start">
              <label className={labelCls}>
                {t("invoice.distributionMethod")} *
              </label>
              <select
                value={
                  distributionMethod === "FIXED"
                    ? fixedMode === "AMOUNT"
                      ? "FIXED_AMOUNT"
                      : "FIXED_EQUAL"
                    : distributionMethod
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "FIXED_EQUAL") {
                    setDistributionMethod("FIXED");
                    setFixedMode("EQUAL");
                  } else if (value === "FIXED_AMOUNT") {
                    setDistributionMethod("FIXED");
                    setFixedMode("AMOUNT");
                  } else {
                    setDistributionMethod(
                      value as "BY_INCOME" | "BY_PERCENT" | "PERSONAL",
                    );
                  }
                }}
                className={inputCls}
              >
                <option value="BY_INCOME">{t("invoice.incomeBased")}</option>
                <option value="BY_PERCENT">
                  {t("subscription.customAmount")}
                </option>
                <option value="FIXED_EQUAL">{t("invoice.equal")}</option>
                <option value="FIXED_AMOUNT">
                  {t("subscription.amountOnly")}
                </option>
                <option value="PERSONAL">
                  {t("invoice.personalExpenseOption")}
                </option>
              </select>
            </div>

            {distributionMethod === "PERSONAL" && users && users.length > 0 && (
              <div className="space-y-2 lg:col-start-2 lg:pl-6">
                <UserSingleSelect
                  title={t("invoice.appliesTo")}
                  value={personalUserId}
                  onChange={setPersonalUserId}
                  roleLabel={(role) =>
                    role === "ADMIN"
                      ? t("users.admin")
                      : role === "CHILD"
                        ? t("users.junior")
                        : t("users.adult")
                  }
                  users={users.filter((u) => {
                    if (!currentUser) return false;
                    if (currentUser.role === "ADMIN") return true;
                    if (currentUser.role === "ADULT") {
                      return u.id === currentUser.id || u.role === "CHILD";
                    }
                    return u.id === currentUser.id;
                  })}
                />
              </div>
            )}

            {distributionMethod === "BY_INCOME" &&
              users &&
              users.length > 0 && (
                <div className="space-y-2 lg:col-start-2 lg:pl-6">
                  <div className="flex items-center justify-between">
                    <label className={labelCls + " mb-0"}>
                      {t("invoice.selectUsers")}
                    </label>
                    {totalIncome === 0 && (
                      <span className="text-xs text-amber-500 dark:text-amber-400">
                        {t("invoice.noIncome")}
                      </span>
                    )}
                  </div>
                  <UserSelectionCards
                    users={users}
                    selectedIds={incomeUserIds}
                    onToggle={handleToggleIncomeUser}
                    roleLabel={(role) =>
                      role === "ADMIN"
                        ? t("users.admin")
                        : role === "CHILD"
                          ? t("users.junior")
                          : t("users.adult")
                    }
                    ariaLabel={(u, selected) =>
                      `${t("invoice.selectUsers")}: ${u.name}`
                    }
                    inlineContent={(u, selected) => {
                      const pct = incomePercent(u.id);
                      const hasIncome = activeIncomes.some(
                        (i) => i.userId === u.id,
                      );
                      if (selected && pct !== null) {
                        return (
                          <span className="text-sm font-semibold text-primary dark:text-primary">
                            {pct}%
                          </span>
                        );
                      }
                      if (selected && !hasIncome) {
                        return (
                          <span className="text-xs text-amber-500">
                            {t("invoice.noIncomeShort")}
                          </span>
                        );
                      }
                      return null;
                    }}
                  />
                  {selectedUserIds.length === 0 && (
                    <p className="text-sm text-amber-500 dark:text-amber-400">
                      {t("invoice.atLeastOneUser")}
                    </p>
                  )}
                </div>
              )}

            {distributionMethod === "BY_PERCENT" &&
              users &&
              users.length > 0 && (
                <div className="space-y-2 lg:col-start-2 lg:pl-6">
                  <div className="flex items-center justify-between">
                    <label className={labelCls + " mb-0"}>
                      {t("subscription.amountPerUser")}
                    </label>
                    <span className="text-sm font-medium text-primary dark:text-primary">
                      {t("invoice.totalLabel")}{" "}
                      {symbolPosition === "Before"
                        ? `${currencySymbol}\u00A0`
                        : ""}
                      {centsToAmount(customAmountTotalCents)}
                      {symbolPosition === "After"
                        ? `\u00A0${currencySymbol}`
                        : ""}
                    </span>
                  </div>
                  <UserSelectionCards
                    users={users}
                    selectedIds={incomeUserIds}
                    onToggle={handleToggleIncomeUser}
                    roleLabel={(role) =>
                      role === "ADMIN"
                        ? t("users.admin")
                        : role === "CHILD"
                          ? t("users.junior")
                          : t("users.adult")
                    }
                    ariaLabel={(u, selected) =>
                      `${t("invoice.selectUsers")}: ${u.name}`
                    }
                    inlineContent={(u, _selected) => (
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="relative flex items-center">
                          {symbolPosition === "Before" && (
                            <span className="absolute left-2 text-xs text-gray-400 pointer-events-none select-none">
                              {currencySymbol}
                            </span>
                          )}
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            disabled={!_selected}
                            value={userPercents[u.id] ?? ""}
                            onChange={(e) =>
                              setUserPercents((prev) => ({
                                ...prev,
                                [u.id]: e.target.value,
                              }))
                            }
                            className={`w-24 sm:w-28 py-1.5 text-sm text-right rounded border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 ${symbolPosition === "Before" ? "pl-5 pr-2" : "pl-2 pr-5"}`}
                            placeholder="0"
                          />
                          {symbolPosition === "After" && (
                            <span className="absolute right-2 text-xs text-gray-400 pointer-events-none select-none">
                              {currencySymbol}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  />
                  {selectedUserIds.length === 0 && (
                    <p className="text-sm text-amber-500 dark:text-amber-400">
                      {t("invoice.atLeastOneUser")}
                    </p>
                  )}
                </div>
              )}

            {distributionMethod === "FIXED" &&
              users &&
              users.length > 0 &&
              (fixedMode === "AMOUNT" ? (
                <div className="space-y-2 lg:col-start-2 lg:pl-6">
                  <div className="flex items-center justify-between">
                    <label className={labelCls + " mb-0"}>
                      {t("subscription.fixedAmountPerUser")}
                    </label>
                    <span
                      className={`text-sm font-semibold ${fixedRemainingCents >= 0 ? "text-primary dark:text-primary" : "text-red-500 dark:text-red-400"}`}
                    >
                      {t("subscription.remainingAmount", {
                        amount:
                          symbolPosition === "Before"
                            ? `${currencySymbol}\u00A0${centsToAmount(fixedRemainingCents)}`
                            : `${centsToAmount(fixedRemainingCents)}\u00A0${currencySymbol}`,
                      })}
                    </span>
                  </div>
                  <UserSelectionCards
                    users={users}
                    selectedIds={incomeUserIds}
                    onToggle={handleToggleIncomeUser}
                    roleLabel={(role) =>
                      role === "ADMIN"
                        ? t("users.admin")
                        : role === "CHILD"
                          ? t("users.junior")
                          : t("users.adult")
                    }
                    ariaLabel={(u) =>
                      `${t("subscription.fixedAmountPerUser")}: ${u.name}`
                    }
                    inlineContent={(u, _selected) => (
                      <div className="relative flex items-center">
                        {symbolPosition === "Before" && (
                          <span className="absolute left-2 text-xs text-gray-400 pointer-events-none select-none">
                            {currencySymbol}
                          </span>
                        )}
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          disabled={!_selected}
                          value={userFixedAmounts[u.id] ?? ""}
                          onChange={(e) =>
                            setUserFixedAmounts((prev) => ({
                              ...prev,
                              [u.id]: e.target.value,
                            }))
                          }
                          className={`w-24 sm:w-28 py-1.5 text-sm text-right rounded border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50 ${symbolPosition === "Before" ? "pl-5 pr-2" : "pl-2 pr-5"}`}
                          placeholder="0"
                        />
                        {symbolPosition === "After" && (
                          <span className="absolute right-2 text-xs text-gray-400 pointer-events-none select-none">
                            {currencySymbol}
                          </span>
                        )}
                      </div>
                    )}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("subscription.remainingAmountHint")}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 lg:col-start-2 lg:pl-6">
                  <div className="flex items-center justify-between">
                    <label className={labelCls + " mb-0"}>
                      {t("invoice.selectUsersEqual")}
                    </label>
                    {equalPercent ? (
                      <span className="text-sm font-medium text-primary dark:text-primary">
                        {equalPercent}
                        {t("invoice.eachPct")}
                      </span>
                    ) : (
                      <span className="text-sm text-amber-500">
                        {t("invoice.atLeastOneUser")}
                      </span>
                    )}
                  </div>
                  <UserSelectionCards
                    users={users}
                    selectedIds={incomeUserIds}
                    onToggle={handleToggleIncomeUser}
                    roleLabel={(role) =>
                      role === "ADMIN"
                        ? t("users.admin")
                        : role === "CHILD"
                          ? t("users.junior")
                          : t("users.adult")
                    }
                    ariaLabel={(u) =>
                      `${t("invoice.selectUsersEqual")}: ${u.name}`
                    }
                    inlineContent={(_u, selected) =>
                      selected && equalPercent ? (
                        <span className="text-sm font-semibold text-primary dark:text-primary">
                          {equalPercent}%
                        </span>
                      ) : null
                    }
                  />
                </div>
              ))}
          </div>
        </form>
      </div>
    </div>
  );
}
