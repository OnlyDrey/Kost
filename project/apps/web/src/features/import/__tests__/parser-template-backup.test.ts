import assert from "node:assert/strict";
import test from "node:test";
import { parseCsvText, matrixToParsed } from "../parser";
import { buildRestorePreview, validateBackupBundle } from "../backup";
import { getTemplateDefinition, toCsv } from "../template";

test("csv parser supports semicolon delimiter", () => {
  const matrix = parseCsvText("description;amount\nRent;1234\n");
  assert.equal(matrix[0][0], "description");
  assert.equal(matrix[1][1], "1234");
});

test("matrixToParsed normalizes headers", () => {
  const parsed = matrixToParsed([["Due Date", "Amount"], ["2026-01-01", "10"]]);
  assert.deepEqual(parsed.headers, ["due_date", "amount"]);
});

test("template definition contains recurring next_due_date", () => {
  const recurring = getTemplateDefinition("recurring");
  assert.ok(recurring.headers.includes("next_due_date"));
});

test("template csv output starts with headers", () => {
  const expense = getTemplateDefinition("expense");
  const csv = toCsv(expense.headers, expense.example);
  assert.ok(csv.startsWith("description,amount,due_date"));
});

test("backup validation rejects invalid payload", () => {
  assert.equal(validateBackupBundle({ foo: "bar" }), false);
});

test("restore preview returns counts and warnings", () => {
  const preview = buildRestorePreview({
    metadata: {
      backupType: "full",
      schemaVersion: 1,
      appVersion: "1.0.0",
      exportedAt: new Date().toISOString(),
    },
    data: {
      periods: [],
      expenses: [],
      recurringExpenses: [],
      categories: ["A"],
      paymentMethods: ["B"],
      vendors: [],
      currency: "NOK",
      currencySymbolPosition: "Before",
      settings: {},
      users: [],
    },
  });

  assert.equal(preview.counts.categories, 1);
  assert.ok(preview.warnings.length > 0);
});
