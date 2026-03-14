export type ImportEntityType = "expense" | "recurring";
export type SpreadsheetFormat = "csv" | "xlsx" | "ods";

export type RowSeverity = "valid" | "warning" | "error";

export interface ImportIssue {
  field?: string;
  message: string;
  severity: Exclude<RowSeverity, "valid">;
}

export interface ParsedSheet {
  headers: string[];
  rows: Record<string, string>[];
}

export interface FieldSpec<TTransformed> {
  key: Extract<keyof TTransformed, string>;
  required?: boolean;
  labelKey: string;
  aliases: string[];
  transform?: (value: string) => unknown;
}

export interface ImportRowResult<TTransformed> {
  sourceRowNumber: number;
  source: Record<string, string>;
  transformed: Partial<TTransformed>;
  issues: ImportIssue[];
  severity: RowSeverity;
}

export interface ImportPreview<TTransformed> {
  mappedFields: Record<string, string | undefined>;
  rows: ImportRowResult<TTransformed>[];
  counts: {
    total: number;
    valid: number;
    warnings: number;
    errors: number;
  };
}

export interface ImportPipelineSpec<TTransformed, TPersistResult = unknown> {
  type: ImportEntityType;
  fields: FieldSpec<TTransformed>[];
  validateRow: (
    row: Partial<TTransformed>,
    source: Record<string, string>,
  ) => ImportIssue[];
  persistRow: (row: Partial<TTransformed>) => Promise<TPersistResult>;
}

export interface ImportExecutionSummary {
  totalRows: number;
  imported: number;
  skipped: number;
  failed: number;
  warnings: string[];
}
