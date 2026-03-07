import test from "node:test";
import assert from "node:assert/strict";
import { buildPreview, mapColumns, normalizeHeader } from "../pipeline";

test("normalizeHeader", () => {
  assert.equal(normalizeHeader("Due Date"), "due_date");
  assert.equal(normalizeHeader(" Payment-Method "), "payment_method");
});

test("mapColumns auto-maps aliases", () => {
  const mapped = mapColumns(
    ["description", "amount", "Due Date"],
    [
      { key: "description", aliases: ["description"] },
      { key: "amount", aliases: ["amount"] },
      { key: "due_date", aliases: ["due_date", "due date"] },
    ],
  );
  assert.equal(mapped.description, "description");
  assert.equal(mapped.due_date, "Due Date");
});

test("buildPreview marks invalid rows", () => {
  const preview = buildPreview(
    [{ description: "Rent", amount: "foo" }],
    {
      type: "expense",
      fields: [
        { key: "description", aliases: ["description"], required: true },
        { key: "amount", aliases: ["amount"], required: true, transform: (v) => {
          const parsed = Number(v);
          if (Number.isNaN(parsed)) throw new Error("Invalid number");
          return parsed;
        } },
      ],
      validateRow: () => [],
      persistRow: async () => undefined,
    },
    { description: "description", amount: "amount" },
  );

  assert.equal(preview.counts.errors, 1);
  assert.equal(preview.rows[0].severity, "error");
});
