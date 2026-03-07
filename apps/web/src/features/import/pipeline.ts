import {
  FieldSpec,
  ImportExecutionSummary,
  ImportIssue,
  ImportPipelineSpec,
  ImportPreview,
  ImportRowResult,
} from "./types";

export function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

export function mapColumns<T>(
  headers: string[],
  fields: FieldSpec<T>[],
): Record<string, string | undefined> {
  const normalized = new Map(headers.map((h) => [normalizeHeader(h), h]));
  const mapped: Record<string, string | undefined> = {};
  for (const field of fields) {
    const key = field.aliases.map(normalizeHeader).find((candidate) => normalized.has(candidate));
    mapped[field.key] = key ? normalized.get(key) : undefined;
  }
  return mapped;
}

function classify(issues: ImportIssue[]): "valid" | "warning" | "error" {
  if (issues.some((issue) => issue.severity === "error")) return "error";
  if (issues.some((issue) => issue.severity === "warning")) return "warning";
  return "valid";
}

export function buildPreview<T>(
  rows: Record<string, string>[],
  spec: ImportPipelineSpec<T>,
  mappedFields: Record<string, string | undefined>,
): ImportPreview<T> {
  const rowResults: ImportRowResult<T>[] = rows.map((source, index) => {
    const transformed: Partial<T> = {};
    const issues: ImportIssue[] = [];

    for (const field of spec.fields) {
      const sourceColumn = mappedFields[field.key];
      const raw = sourceColumn ? source[sourceColumn] ?? "" : "";

      if (!sourceColumn && field.required) {
        issues.push({ field: field.key, message: `Missing required mapping`, severity: "error" });
        continue;
      }

      const trimmed = raw.trim();
      if (!trimmed) {
        if (field.required) {
          issues.push({ field: field.key, message: `Required value missing`, severity: "error" });
        }
        continue;
      }

      try {
        const transformedValue = field.transform ? field.transform(trimmed) : trimmed;
        if (field.apply) {
          field.apply(transformed, transformedValue);
        } else {
          (transformed as Record<string, unknown>)[field.key] = transformedValue;
        }
      } catch (error) {
        issues.push({
          field: field.key,
          message: error instanceof Error ? error.message : "Invalid value",
          severity: "error",
        });
      }
    }

    issues.push(...spec.validateRow(transformed, source));
    return {
      sourceRowNumber: index + 2,
      source,
      transformed,
      issues,
      severity: classify(issues),
    };
  });

  const counts = {
    total: rowResults.length,
    valid: rowResults.filter((r) => r.severity === "valid").length,
    warnings: rowResults.filter((r) => r.severity === "warning").length,
    errors: rowResults.filter((r) => r.severity === "error").length,
  };

  return { mappedFields, rows: rowResults, counts };
}

export async function executeImport<T>(
  preview: ImportPreview<T>,
  spec: ImportPipelineSpec<T>,
): Promise<ImportExecutionSummary> {
  const summary: ImportExecutionSummary = {
    imported: 0,
    skipped: 0,
    failed: 0,
    warnings: [],
  };

  for (const row of preview.rows) {
    if (row.severity === "error") {
      summary.skipped += 1;
      continue;
    }

    try {
      await spec.persistRow(row.transformed);
      summary.imported += 1;
      if (row.severity === "warning") {
        summary.warnings.push(`Row ${row.sourceRowNumber}: imported with warnings`);
      }
    } catch (_error) {
      summary.failed += 1;
    }
  }

  return summary;
}
