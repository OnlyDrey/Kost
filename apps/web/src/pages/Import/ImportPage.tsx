import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/button";
import AppSelect from "../../components/Common/AppSelect";
import { useCategories, usePaymentMethods, useVendors, useCurrentPeriod } from "../../hooks/useApi";
import { buildPreview, executeImport, mapColumns } from "../../features/import/pipeline";
import { parseSpreadsheet } from "../../features/import/parser";
import { downloadImportTemplate } from "../../features/import/template";
import { buildExpenseImportSpec, buildRecurringImportSpec } from "../../features/import/specs";
import { ImportEntityType, ImportPreview, SpreadsheetFormat } from "../../features/import/types";

export default function ImportPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const type = (params.get("type") as ImportEntityType) || "expense";
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [preview, setPreview] = useState<ImportPreview<any> | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [templateFormat, setTemplateFormat] = useState<SpreadsheetFormat>("csv");

  const { data: categories = [] } = useCategories();
  const { data: vendors = [] } = useVendors();
  const { data: paymentMethods = [] } = usePaymentMethods();
  const { data: currentPeriod } = useCurrentPeriod();

  const spec = useMemo(() => {
    if (type === "expense") {
      return buildExpenseImportSpec({
        periodId: currentPeriod?.id ?? "",
        categories,
        vendors: vendors.map((v) => v.name),
        paymentMethods,
      });
    }
    return buildRecurringImportSpec({
      categories,
      vendors: vendors.map((v) => v.name),
      paymentMethods,
    });
  }, [type, currentPeriod?.id, categories, vendors, paymentMethods]);

  const mapped = useMemo(() => mapColumns(parsedHeaders, spec.fields), [parsedHeaders, spec.fields]);

  const onUpload = async (file?: File) => {
    if (!file) return;
    const parsed = await parseSpreadsheet(file);
    setParsedHeaders(parsed.headers);
    setRows(parsed.rows);
    setPreview(null);
    setSummary("");
  };

  const generatePreview = () => {
    setPreview(buildPreview(rows, spec, mapped));
  };

  const runImport = async () => {
    if (!preview) return;
    setIsExecuting(true);
    try {
      const result = await executeImport(preview, spec);
      setSummary(
        `${t("import.summary.imported")}: ${result.imported} · ${t("import.summary.skipped")}: ${result.skipped} · ${t("import.summary.failed")}: ${result.failed}`,
      );
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("import.title")}</h1>
        <Button variant="secondary" onClick={() => navigate(-1)}>{t("common.cancel")}</Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <AppSelect value={type} onChange={(e) => setParams({ type: e.target.value })} className="h-10">
          <option value="expense">{t("import.type.expense")}</option>
          <option value="recurring">{t("import.type.recurring")}</option>
        </AppSelect>

        <div className="flex gap-2">
          <AppSelect value={templateFormat} onChange={(e) => setTemplateFormat(e.target.value as SpreadsheetFormat)} className="h-10">
            <option value="csv">CSV</option>
            <option value="xlsx">XLSX</option>
            <option value="ods">ODS</option>
          </AppSelect>
          <Button variant="secondary" onClick={() => downloadImportTemplate(type, templateFormat)}>{t("import.downloadTemplate")}</Button>
        </div>

        <input type="file" accept=".csv,.xlsx,.ods" className="h-10 text-sm" onChange={(e) => onUpload(e.target.files?.[0])} />
      </div>

      {parsedHeaders.length > 0 && (
        <div className="rounded-lg border p-3 space-y-2">
          <div className="text-sm font-semibold">{t("import.detectedColumns")}</div>
          <div className="flex flex-wrap gap-2">{parsedHeaders.map((header) => <span key={header} className="px-2 py-1 rounded bg-gray-100 text-xs">{header}</span>)}</div>
          <Button onClick={generatePreview}>{t("import.generatePreview")}</Button>
        </div>
      )}

      {preview && (
        <div className="rounded-lg border p-3 space-y-3">
          <div className="text-sm">
            {t("import.counts.total")}: {preview.counts.total} · {t("import.counts.valid")}: {preview.counts.valid} · {t("import.counts.warnings")}: {preview.counts.warnings} · {t("import.counts.errors")}: {preview.counts.errors}
          </div>
          <div className="max-h-80 overflow-auto border rounded">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-gray-50"><th className="px-2 py-1 text-left">#</th><th className="px-2 py-1 text-left">{t("import.status")}</th><th className="px-2 py-1 text-left">{t("import.issues")}</th></tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.sourceRowNumber} className="border-t">
                    <td className="px-2 py-1">{row.sourceRowNumber}</td>
                    <td className="px-2 py-1">{row.severity}</td>
                    <td className="px-2 py-1">{row.issues.map((issue, i) => <div key={i}>{issue.message}</div>)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button disabled={isExecuting || (type === "expense" && !currentPeriod?.id)} onClick={runImport}>{isExecuting ? t("import.importing") : t("import.confirmImport")}</Button>
          {summary && <div className="text-sm text-green-700">{summary}</div>}
        </div>
      )}
    </div>
  );
}
