import { invoiceApi, subscriptionApi } from "../../services/api";
import { amountToCents } from "../../utils/currency";
import { ImportIssue, ImportPipelineSpec } from "./types";

export interface ExpenseImportRow {
  description: string;
  amount: number;
  due_date?: string;
  category?: string;
  vendor?: string;
  payment_method?: string;
  status?: string;
  notes?: string;
}

export interface RecurringImportRow {
  description: string;
  default_amount?: number;
  due_day?: number;
  next_due_date?: string;
  category?: string;
  vendor?: string;
  payment_method?: string;
  frequency?: string;
  active?: boolean;
  notes?: string;
}

function parseAmount(value: string): number {
  const normalized = value.replace(/\s+/g, "").replace(",", ".");
  const numeric = Number(normalized);
  if (!Number.isFinite(numeric)) throw new Error("Invalid number");
  return numeric;
}

function parseDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date");
  return date.toISOString().slice(0, 10);
}

function parseBoolean(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "y", "ja"].includes(normalized)) return true;
  if (["false", "0", "no", "n", "nei"].includes(normalized)) return false;
  throw new Error("Invalid boolean");
}

function findReferenceIssue(field: string, value: string | undefined, validSet: Set<string>): ImportIssue[] {
  if (!value) return [];
  if (validSet.has(value.toLowerCase())) return [];
  return [{ field, severity: "warning", message: `${field} does not match existing value` }];
}

export function buildExpenseImportSpec(args: {
  periodId: string;
  categories: string[];
  vendors: string[];
  paymentMethods: string[];
}): ImportPipelineSpec<ExpenseImportRow> {
  const categories = new Set(args.categories.map((v) => v.toLowerCase()));
  const vendors = new Set(args.vendors.map((v) => v.toLowerCase()));
  const paymentMethods = new Set(args.paymentMethods.map((v) => v.toLowerCase()));
  const validStatus = new Set(["UNPAID", "PARTIALLY_PAID", "PAID"]);

  return {
    type: "expense",
    fields: [
      { key: "description", labelKey: "invoice.description", required: true, aliases: ["description", "name", "text"] },
      { key: "amount", labelKey: "invoice.amount", required: true, aliases: ["amount", "sum", "value"], transform: parseAmount },
      { key: "due_date", labelKey: "invoice.dueDate", aliases: ["due_date", "due date"], transform: parseDate },
      { key: "category", labelKey: "invoice.category", aliases: ["category"] },
      { key: "vendor", labelKey: "invoice.vendor", aliases: ["vendor", "merchant", "payee"] },
      { key: "payment_method", labelKey: "invoice.paymentMethod", aliases: ["payment_method", "payment method"] },
      { key: "status", labelKey: "invoice.status", aliases: ["status"] },
      { key: "notes", labelKey: "common.notes", aliases: ["notes", "note"] },
    ],
    validateRow: (row) => {
      const issues: ImportIssue[] = [];
      if (row.status && !validStatus.has(String(row.status).toUpperCase())) {
        issues.push({ field: "status", severity: "error", message: "Unsupported status" });
      }
      issues.push(...findReferenceIssue("category", row.category, categories));
      issues.push(...findReferenceIssue("vendor", row.vendor, vendors));
      issues.push(...findReferenceIssue("payment_method", row.payment_method, paymentMethods));
      return issues;
    },
    persistRow: async (row) => {
      await invoiceApi.create({
        periodId: args.periodId,
        vendor: row.vendor || "Imported",
        category: row.category || "Imported",
        description: row.description,
        dueDate: row.due_date,
        totalCents: amountToCents(row.amount ?? 0),
        distributionMethod: "BY_INCOME",
      });
    },
  };
}

export function buildRecurringImportSpec(args: {
  categories: string[];
  vendors: string[];
  paymentMethods: string[];
}): ImportPipelineSpec<RecurringImportRow> {
  const categories = new Set(args.categories.map((v) => v.toLowerCase()));
  const vendors = new Set(args.vendors.map((v) => v.toLowerCase()));
  const paymentMethods = new Set(args.paymentMethods.map((v) => v.toLowerCase()));
  const allowedFrequency = new Set(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]);

  return {
    type: "recurring",
    fields: [
      { key: "description", labelKey: "invoice.description", required: true, aliases: ["description", "name"] },
      { key: "default_amount", labelKey: "invoice.amount", aliases: ["default_amount", "amount"], transform: parseAmount },
      { key: "due_day", labelKey: "subscription.dayOfMonth", aliases: ["due_day", "day", "day_of_month"], transform: (v) => Number.parseInt(v, 10) },
      { key: "next_due_date", labelKey: "subscription.nextBillingAt", aliases: ["next_due_date", "next date"], transform: parseDate },
      { key: "frequency", labelKey: "subscription.frequency", aliases: ["frequency"] },
      { key: "category", labelKey: "invoice.category", aliases: ["category"] },
      { key: "vendor", labelKey: "invoice.vendor", aliases: ["vendor"] },
      { key: "payment_method", labelKey: "invoice.paymentMethod", aliases: ["payment_method", "payment method"] },
      { key: "active", labelKey: "common.active", aliases: ["active", "enabled"], transform: parseBoolean },
      { key: "notes", labelKey: "common.notes", aliases: ["notes"] },
    ],
    validateRow: (row) => {
      const issues: ImportIssue[] = [];
      const frequency = String(row.frequency ?? "").toUpperCase();
      if (frequency && !(allowedFrequency.has(frequency) || /^\d+_(DAY|WEEK|MONTH|YEAR)$/.test(frequency))) {
        issues.push({ field: "frequency", severity: "error", message: "Unsupported frequency" });
      }
      if (row.due_day !== undefined && (!Number.isInteger(row.due_day) || row.due_day < 1 || row.due_day > 31)) {
        issues.push({ field: "due_day", severity: "error", message: "Due day must be between 1 and 31" });
      }
      issues.push(...findReferenceIssue("category", row.category, categories));
      issues.push(...findReferenceIssue("vendor", row.vendor, vendors));
      issues.push(...findReferenceIssue("payment_method", row.payment_method, paymentMethods));
      return issues;
    },
    persistRow: async (row) => {
      await subscriptionApi.create({
        name: row.description ?? "Imported recurring",
        vendor: row.vendor || "Imported",
        category: row.category,
        description: row.notes,
        amountCents: amountToCents(row.default_amount ?? 0),
        frequency: String(row.frequency ?? "MONTHLY").toUpperCase(),
        dayOfMonth: row.due_day,
        startDate: new Date().toISOString().slice(0, 10),
        nextBillingAt: row.next_due_date,
        distributionMethod: "BY_INCOME",
        active: row.active ?? true,
        status: row.active === false ? "PAUSED" : "ACTIVE",
      });
    },
  };
}
