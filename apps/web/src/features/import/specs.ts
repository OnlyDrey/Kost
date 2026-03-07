import { invoiceApi, subscriptionApi } from "../../services/api";
import { amountToCents } from "../../utils/currency";
import { ImportIssue, ImportPipelineSpec } from "./types";

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

function findReferenceIssue(
  field: string,
  value: string | undefined,
  validSet: Set<string>,
): ImportIssue[] {
  if (!value) return [];
  if (validSet.has(value.toLowerCase())) return [];
  return [{ field, severity: "warning", message: `${field} does not match existing value` }];
}

export function buildExpenseImportSpec(args: {
  periodId: string;
  categories: string[];
  vendors: string[];
  paymentMethods: string[];
}): ImportPipelineSpec<any> {
  const categories = new Set(args.categories.map((v) => v.toLowerCase()));
  const vendors = new Set(args.vendors.map((v) => v.toLowerCase()));
  const paymentMethods = new Set(args.paymentMethods.map((v) => v.toLowerCase()));

  return {
    type: "expense",
    fields: [
      { key: "description", required: true, aliases: ["description", "name", "text"] },
      { key: "amount", required: true, aliases: ["amount", "sum", "value"], transform: parseAmount },
      { key: "due_date", aliases: ["due_date", "due date"], transform: parseDate },
      { key: "category", aliases: ["category"] },
      { key: "vendor", aliases: ["vendor", "merchant", "payee"] },
      { key: "payment_method", aliases: ["payment_method", "payment method"] },
      { key: "status", aliases: ["status"] },
      { key: "notes", aliases: ["notes", "note"] },
    ],
    validateRow: (row) => {
      const issues: ImportIssue[] = [];
      issues.push(...findReferenceIssue("category", row.category as string, categories));
      issues.push(...findReferenceIssue("vendor", row.vendor as string, vendors));
      issues.push(...findReferenceIssue("payment_method", row.payment_method as string, paymentMethods));
      return issues;
    },
    persistRow: async (row) => {
      await invoiceApi.create({
        periodId: args.periodId,
        vendor: (row.vendor as string) || "Imported",
        category: (row.category as string) || "Imported",
        description: row.description as string,
        dueDate: row.due_date as string | undefined,
        totalCents: amountToCents((row.amount as number) ?? 0),
        distributionMethod: "BY_INCOME",
      });
    },
  };
}

export function buildRecurringImportSpec(args: {
  categories: string[];
  vendors: string[];
  paymentMethods: string[];
}): ImportPipelineSpec<any> {
  const categories = new Set(args.categories.map((v) => v.toLowerCase()));
  const vendors = new Set(args.vendors.map((v) => v.toLowerCase()));
  const paymentMethods = new Set(args.paymentMethods.map((v) => v.toLowerCase()));
  const allowedFrequency = new Set(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]);

  return {
    type: "recurring",
    fields: [
      { key: "description", required: true, aliases: ["description", "name"] },
      { key: "default_amount", aliases: ["default_amount", "amount"], transform: parseAmount },
      { key: "due_day", aliases: ["due_day", "day", "day_of_month"], transform: (v) => Number.parseInt(v, 10) },
      { key: "next_due_date", aliases: ["next_due_date", "next date"], transform: parseDate },
      { key: "category", aliases: ["category"] },
      { key: "vendor", aliases: ["vendor"] },
      { key: "payment_method", aliases: ["payment_method", "payment method"] },
      { key: "frequency", aliases: ["frequency"] },
      { key: "active", aliases: ["active", "enabled"], transform: parseBoolean },
      { key: "notes", aliases: ["notes"] },
    ],
    validateRow: (row) => {
      const issues: ImportIssue[] = [];
      const frequency = String(row.frequency ?? "").toUpperCase();
      if (frequency && !(allowedFrequency.has(frequency) || /^\d+_(DAY|WEEK|MONTH|YEAR)$/.test(frequency))) {
        issues.push({ field: "frequency", severity: "error", message: "Unsupported frequency" });
      }
      issues.push(...findReferenceIssue("category", row.category as string, categories));
      issues.push(...findReferenceIssue("vendor", row.vendor as string, vendors));
      issues.push(...findReferenceIssue("payment_method", row.payment_method as string, paymentMethods));
      return issues;
    },
    persistRow: async (row) => {
      await subscriptionApi.create({
        name: row.description as string,
        vendor: (row.vendor as string) || "Imported",
        category: row.category as string | undefined,
        description: row.notes as string | undefined,
        amountCents: amountToCents((row.default_amount as number) ?? 0),
        frequency: String(row.frequency ?? "MONTHLY").toUpperCase(),
        dayOfMonth: typeof row.due_day === "number" && Number.isFinite(row.due_day) ? Math.min(31, Math.max(1, row.due_day)) : undefined,
        startDate: new Date().toISOString().slice(0, 10),
        nextBillingAt: row.next_due_date as string | undefined,
        distributionMethod: "BY_INCOME",
        active: typeof row.active === "boolean" ? row.active : true,
        status: typeof row.active === "boolean" ? (row.active ? "ACTIVE" : "PAUSED") : "ACTIVE",
      });
    },
  };
}
