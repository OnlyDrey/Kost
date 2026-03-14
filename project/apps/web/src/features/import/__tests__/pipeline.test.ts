import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPreview,
  executeImport,
  normalizeHeader,
  suggestColumnMapping,
} from "../pipeline";

test("normalizeHeader", () => {
  assert.equal(normalizeHeader("Due Date"), "due_date");
  assert.equal(normalizeHeader(" Payment-Method "), "payment_method");
});

test("suggestColumnMapping auto-maps aliases", () => {
  const mapped = suggestColumnMapping(
    ["description", "amount", "Due Date"],
    [
      {
        key: "description",
        labelKey: "invoice.description",
        aliases: ["description"],
      },
      { key: "amount", labelKey: "invoice.amount", aliases: ["amount"] },
      {
        key: "due_date",
        labelKey: "invoice.dueDate",
        aliases: ["due_date", "due date"],
      },
    ],
  );
  assert.equal(mapped.description, "description");
  assert.equal(mapped.due_date, "Due Date");
});

test("manual mapping overrides auto mapping", () => {
  const manual = { description: "desc_col", amount: "amt_col" };
  const preview = buildPreview(
    [{ desc_col: "Rent", amt_col: "999" }],
    {
      type: "expense",
      fields: [
        {
          key: "description",
          labelKey: "invoice.description",
          aliases: ["description"],
          required: true,
        },
        {
          key: "amount",
          labelKey: "invoice.amount",
          aliases: ["amount"],
          required: true,
          transform: (v) => Number(v),
        },
      ],
      validateRow: () => [],
      persistRow: async () => undefined,
    },
    manual,
  );

  assert.equal(preview.rows[0].severity, "valid");
});

test("buildPreview marks invalid rows", () => {
  const preview = buildPreview(
    [{ description: "Rent", amount: "foo" }],
    {
      type: "expense",
      fields: [
        {
          key: "description",
          labelKey: "invoice.description",
          aliases: ["description"],
          required: true,
        },
        {
          key: "amount",
          labelKey: "invoice.amount",
          aliases: ["amount"],
          required: true,
          transform: (v) => {
            const parsed = Number(v);
            if (Number.isNaN(parsed)) throw new Error("Invalid number");
            return parsed;
          },
        },
      ],
      validateRow: () => [],
      persistRow: async () => undefined,
    },
    { description: "description", amount: "amount" },
  );

  assert.equal(preview.counts.errors, 1);
  assert.equal(preview.rows[0].severity, "error");
});

test("executeImport summary counts", async () => {
  const preview = {
    mappedFields: {},
    counts: { total: 2, valid: 1, warnings: 0, errors: 1 },
    rows: [
      {
        sourceRowNumber: 2,
        source: {},
        transformed: { description: "ok" },
        issues: [],
        severity: "valid" as const,
      },
      {
        sourceRowNumber: 3,
        source: {},
        transformed: { description: "bad" },
        issues: [{ message: "error", severity: "error" as const }],
        severity: "error" as const,
      },
    ],
  };

  const result = await executeImport(preview, {
    type: "expense",
    fields: [],
    validateRow: () => [],
    persistRow: async () => undefined,
  });

  assert.equal(result.totalRows, 2);
  assert.equal(result.imported, 1);
  assert.equal(result.skipped, 1);
});
