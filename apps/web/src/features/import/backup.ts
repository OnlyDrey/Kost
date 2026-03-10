import {
  familyApi,
  invoiceApi,
  periodApi,
  subscriptionApi,
  type Invoice,
  type Period,
  type Subscription,
  type User,
  type Vendor,
  userApi,
} from "../../services/api";

const BACKUP_SCHEMA_VERSION = 1;

export interface BackupMetadata {
  backupType: "full";
  schemaVersion: number;
  appVersion: string;
  exportedAt: string;
}

export interface BackupData {
  periods: Period[];
  expenses: Invoice[];
  recurringExpenses: Subscription[];
  categories: string[];
  paymentMethods: string[];
  vendors: Vendor[];
  currency: string;
  currencySymbolPosition: string;
  settings?: unknown;
  users: Pick<User, "id" | "name" | "username" | "role">[];
}

export interface BackupBundle {
  metadata: BackupMetadata;
  data: BackupData;
}

export interface RestorePreview {
  metadata: BackupMetadata;
  counts: {
    periods: number;
    expenses: number;
    recurringExpenses: number;
    categories: number;
    paymentMethods: number;
    vendors: number;
    users: number;
  };
  warnings: string[];
}

export interface RestoreSummary {
  imported: number;
  skipped: number;
  failed: number;
  warnings: string[];
}

function buildBackupFileName(dateValue: string) {
  const date = new Date(dateValue);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `kost-backup-${y}-${m}-${d}-${hh}${mm}.json`;
}

function downloadJson(json: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(json, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportFullBackup(
  settings?: unknown,
): Promise<BackupBundle> {
  const [
    periods,
    expenses,
    recurringExpenses,
    categories,
    paymentMethods,
    vendors,
    currency,
    currencySymbolPosition,
    users,
  ] = await Promise.all([
    periodApi.getAll().then((res) => res.data),
    invoiceApi.getAll().then((res) => res.data),
    subscriptionApi.getAll().then((res) => res.data),
    familyApi.getCategories().then((res) => res.data),
    familyApi.getPaymentMethods().then((res) => res.data),
    familyApi.getVendors().then((res) => res.data),
    familyApi.getCurrency().then((res) => res.data),
    familyApi.getCurrencySymbolPosition().then((res) => res.data),
    userApi.getAll().then((res) => res.data),
  ]);

  return {
    metadata: {
      backupType: "full",
      schemaVersion: BACKUP_SCHEMA_VERSION,
      appVersion: "1.0.0",
      exportedAt: new Date().toISOString(),
    },
    data: {
      periods,
      expenses,
      recurringExpenses,
      categories,
      paymentMethods,
      vendors,
      currency,
      currencySymbolPosition,
      settings,
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      })),
    },
  };
}

export async function downloadFullBackup(
  settings?: unknown,
): Promise<BackupBundle> {
  const bundle = await exportFullBackup(settings);
  downloadJson(bundle, buildBackupFileName(bundle.metadata.exportedAt));
  return bundle;
}

export function validateBackupBundle(value: unknown): value is BackupBundle {
  const bundle = value as Partial<BackupBundle>;
  return Boolean(
    bundle?.metadata &&
    bundle?.data &&
    bundle.metadata.backupType === "full" &&
    typeof bundle.metadata.schemaVersion === "number" &&
    Array.isArray(bundle.data.expenses) &&
    Array.isArray(bundle.data.recurringExpenses) &&
    Array.isArray(bundle.data.categories) &&
    Array.isArray(bundle.data.paymentMethods) &&
    Array.isArray(bundle.data.vendors),
  );
}

export async function parseBackupFile(file: File): Promise<BackupBundle> {
  const text = await file.text();
  const parsed = JSON.parse(text) as unknown;
  if (!validateBackupBundle(parsed)) {
    throw new Error("Invalid backup file");
  }
  if (parsed.metadata.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new Error("Unsupported backup schema version");
  }
  return parsed;
}

export function buildRestorePreview(bundle: BackupBundle): RestorePreview {
  const warnings = [
    "Restore uses merge strategy and may skip duplicates.",
    "Expenses in closed periods are skipped to respect period lock.",
  ];

  return {
    metadata: bundle.metadata,
    counts: {
      periods: bundle.data.periods.length,
      expenses: bundle.data.expenses.length,
      recurringExpenses: bundle.data.recurringExpenses.length,
      categories: bundle.data.categories.length,
      paymentMethods: bundle.data.paymentMethods.length,
      vendors: bundle.data.vendors.length,
      users: bundle.data.users.length,
    },
    warnings,
  };
}

export async function restoreFromBackup(
  bundle: BackupBundle,
): Promise<RestoreSummary> {
  const summary: RestoreSummary = {
    imported: 0,
    skipped: 0,
    failed: 0,
    warnings: [],
  };

  const [
    existingPeriods,
    existingCategories,
    existingPaymentMethods,
    existingVendors,
    existingExpenses,
    existingRecurring,
  ] = await Promise.all([
    periodApi.getAll().then((res) => res.data),
    familyApi.getCategories().then((res) => res.data),
    familyApi.getPaymentMethods().then((res) => res.data),
    familyApi.getVendors().then((res) => res.data),
    invoiceApi.getAll().then((res) => res.data),
    subscriptionApi.getAll().then((res) => res.data),
  ]);

  const openPeriods = new Set(
    existingPeriods.filter((p) => p.status === "OPEN").map((p) => p.id),
  );

  for (const category of bundle.data.categories) {
    if (existingCategories.includes(category)) {
      summary.skipped += 1;
      continue;
    }
    try {
      await familyApi.addCategory(category);
      summary.imported += 1;
    } catch {
      summary.failed += 1;
    }
  }

  for (const method of bundle.data.paymentMethods) {
    if (existingPaymentMethods.includes(method)) {
      summary.skipped += 1;
      continue;
    }
    try {
      await familyApi.addPaymentMethod(method);
      summary.imported += 1;
    } catch {
      summary.failed += 1;
    }
  }

  for (const vendor of bundle.data.vendors) {
    if (existingVendors.some((v) => v.name === vendor.name)) {
      summary.skipped += 1;
      continue;
    }
    try {
      await familyApi.addVendor(vendor.name, vendor.logoUrl);
      summary.imported += 1;
    } catch {
      summary.failed += 1;
    }
  }

  for (const recurring of bundle.data.recurringExpenses) {
    if (
      existingRecurring.some(
        (item) =>
          item.name === recurring.name && item.vendor === recurring.vendor,
      )
    ) {
      summary.skipped += 1;
      continue;
    }
    try {
      await subscriptionApi.create({
        name: recurring.name,
        vendor: recurring.vendor,
        category: recurring.category,
        description: recurring.description,
        amountCents: recurring.amountCents,
        frequency: recurring.frequency,
        dayOfMonth: recurring.dayOfMonth,
        startDate: recurring.startDate,
        endDate: recurring.endDate,
        distributionMethod: recurring.distributionMethod,
        distributionRules: recurring.distributionRules,
        active: recurring.active,
        nextBillingAt: recurring.nextBillingAt,
        status: recurring.status,
      });
      summary.imported += 1;
    } catch {
      summary.failed += 1;
    }
  }

  for (const expense of bundle.data.expenses) {
    if (!openPeriods.has(expense.periodId)) {
      summary.skipped += 1;
      summary.warnings.push(
        `Skipped expense ${expense.description || expense.id}: period ${expense.periodId} is closed or missing.`,
      );
      continue;
    }
    if (
      existingExpenses.some(
        (item) =>
          item.periodId === expense.periodId &&
          item.vendor === expense.vendor &&
          item.description === expense.description &&
          item.totalCents === expense.totalCents,
      )
    ) {
      summary.skipped += 1;
      continue;
    }

    try {
      await invoiceApi.create({
        periodId: expense.periodId,
        category: expense.category,
        vendor: expense.vendor,
        description: expense.description,
        dueDate: expense.dueDate,
        totalCents: expense.totalCents,
        distributionMethod: expense.distributionMethod,
        distributionRules:
          (expense.distribution as Record<string, unknown>) || undefined,
      });
      summary.imported += 1;
    } catch {
      summary.failed += 1;
    }
  }

  try {
    if (bundle.data.currency)
      await familyApi.updateCurrency(bundle.data.currency);
    if (
      bundle.data.currencySymbolPosition === "Before" ||
      bundle.data.currencySymbolPosition === "After"
    ) {
      await familyApi.updateCurrencySymbolPosition(
        bundle.data.currencySymbolPosition as "Before" | "After",
      );
    }
  } catch {
    summary.warnings.push("Could not restore currency settings.");
  }

  return summary;
}
