import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import AppSelect from "../../components/Common/AppSelect";
import { Button } from "../../components/ui/button";
import {
  buildRestorePreview,
  downloadFullBackup,
  parseBackupFile,
  restoreFromBackup,
  type BackupBundle,
  type RestoreSummary,
} from "../../features/import/backup";
import { parseSpreadsheet } from "../../features/import/parser";
import {
  buildPreview,
  executeImport,
  suggestColumnMapping,
} from "../../features/import/pipeline";
import { buildExpenseImportSpec, buildRecurringImportSpec } from "../../features/import/specs";
import { downloadImportTemplate } from "../../features/import/template";
import type {
  ImportEntityType,
  ImportExecutionSummary,
  ImportPreview,
  SpreadsheetFormat,
} from "../../features/import/types";
import {
  useCategories,
  useCurrentPeriod,
  usePeriods,
  usePaymentMethods,
  useVendors,
} from "../../hooks/useApi";
import { useSettings } from "../../stores/settings.context";

export default function ImportPage() {
  const { t } = useTranslation();
  const { settings } = useSettings();

  const [importType, setImportType] = useState<ImportEntityType>("expense");
  const [templateType, setTemplateType] = useState<ImportEntityType>("expense");
  const [templateFormat, setTemplateFormat] = useState<SpreadsheetFormat>("csv");

  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string | undefined>>({});
  const [preview, setPreview] = useState<ImportPreview<unknown> | null>(null);
  const [importSummary, setImportSummary] = useState<ImportExecutionSummary | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const [backupInfo, setBackupInfo] = useState<string>("");
  const [backupError, setBackupError] = useState<string>("");
  const [backupBundle, setBackupBundle] = useState<BackupBundle | null>(null);
  const [restoreSummary, setRestoreSummary] = useState<RestoreSummary | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const { data: categories = [] } = useCategories();
  const { data: vendors = [] } = useVendors();
  const { data: paymentMethods = [] } = usePaymentMethods();
  const { data: currentPeriod } = useCurrentPeriod();
  const { data: periods = [] } = usePeriods();
  const targetOpenPeriodId = (currentPeriod && currentPeriod.status === "OPEN" ? currentPeriod.id : periods.find((p) => p.status === "OPEN")?.id) ?? "";

  const importSpec = useMemo(() => {
    if (importType === "expense") {
      return buildExpenseImportSpec({
        periodId: targetOpenPeriodId,
        categories,
        vendors: vendors.map((vendor) => vendor.name),
        paymentMethods,
      });
    }

    return buildRecurringImportSpec({
      categories,
      vendors: vendors.map((vendor) => vendor.name),
      paymentMethods,
    });
  }, [categories, importType, paymentMethods, targetOpenPeriodId, vendors]);

  const onSpreadsheetUpload = async (file?: File) => {
    if (!file) return;
    const parsed = await parseSpreadsheet(file);
    setParsedHeaders(parsed.headers);
    setRows(parsed.rows);
    setPreview(null);
    setImportSummary(null);
    setMapping(suggestColumnMapping(parsed.headers, importSpec.fields));
  };

  const generatePreview = () => {
    const generated = buildPreview(rows, importSpec as never, mapping);
    setPreview(generated);
    setImportSummary(null);
  };

  const confirmImport = async () => {
    if (!preview) return;
    setIsImporting(true);
    try {
      const summary = await executeImport(preview, importSpec as never);
      setImportSummary(summary);
    } finally {
      setIsImporting(false);
    }
  };

  const exportBackup = async () => {
    setBackupInfo("");
    setBackupError("");
    try {
      const bundle = await downloadFullBackup(settings);
      setBackupInfo(`${t("importExport.backupExportedAt")}: ${bundle.metadata.exportedAt}`);
    } catch {
      setBackupError(t("importExport.backupExportFailed"));
    }
  };

  const onBackupUpload = async (file?: File) => {
    if (!file) return;
    setBackupError("");
    setRestoreSummary(null);
    try {
      const parsed = await parseBackupFile(file);
      setBackupBundle(parsed);
    } catch {
      setBackupBundle(null);
      setBackupError(t("importExport.invalidBackup"));
    }
  };

  const confirmRestore = async () => {
    if (!backupBundle) return;
    setIsRestoring(true);
    try {
      const summary = await restoreFromBackup(backupBundle);
      setRestoreSummary(summary);
    } finally {
      setIsRestoring(false);
    }
  };

  const restorePreview = useMemo(
    () => (backupBundle ? buildRestorePreview(backupBundle) : null),
    [backupBundle],
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("importExport.title")}</h1>

      <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h2 className="text-lg font-semibold">{t("importExport.importData")}</h2>

        <div className="grid md:grid-cols-2 gap-3">
          <AppSelect value={importType} onChange={(e) => setImportType(e.target.value as ImportEntityType)} className="h-10">
            <option value="expense">{t("import.type.expense")}</option>
            <option value="recurring">{t("import.type.recurring")}</option>
          </AppSelect>
          <input type="file" accept=".csv,.xlsx,.ods" className="h-10 text-sm" onChange={(e) => void onSpreadsheetUpload(e.target.files?.[0])} />
        </div>

        {parsedHeaders.length > 0 && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 space-y-2">
            <div className="text-sm font-semibold">{t("import.detectedColumns")}</div>
            <div className="grid md:grid-cols-2 gap-2">
              {importSpec.fields.map((field) => (
                <div key={field.key} className="grid grid-cols-2 items-center gap-2">
                  <label className="text-xs text-gray-600 dark:text-gray-300">
                    {t(field.labelKey)} {field.required ? `(${t("common.required")})` : `(${t("common.optional")})`}
                  </label>
                  <AppSelect
                    value={mapping[field.key] || ""}
                    onChange={(e) =>
                      setMapping((prev) => ({
                        ...prev,
                        [field.key]: e.target.value || undefined,
                      }))
                    }
                    className="h-10"
                  >
                    <option value="">{t("import.unmapped")}</option>
                    {parsedHeaders.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </AppSelect>
                </div>
              ))}
            </div>
            <Button onClick={generatePreview}>{t("import.generatePreview")}</Button>
          </div>
        )}

        {preview && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 space-y-3">
            <div className="text-sm">
              {t("import.counts.total")}: {preview.counts.total} · {t("import.counts.valid")}: {preview.counts.valid} · {t("import.counts.warnings")}: {preview.counts.warnings} · {t("import.counts.errors")}: {preview.counts.errors}
            </div>
            <div className="max-h-72 overflow-auto border rounded">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-2 py-1 text-left">#</th>
                    <th className="px-2 py-1 text-left">{t("import.status")}</th>
                    <th className="px-2 py-1 text-left">{t("import.issues")}</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row) => (
                    <tr key={row.sourceRowNumber} className="border-t border-gray-200 dark:border-gray-700">
                      <td className="px-2 py-1">{row.sourceRowNumber}</td>
                      <td className="px-2 py-1">{row.severity}</td>
                      <td className="px-2 py-1">{row.issues.map((issue, idx) => <div key={idx}>{issue.message}</div>)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button disabled={isImporting || (importType === "expense" && !targetOpenPeriodId)} onClick={() => void confirmImport()}>
              {isImporting ? t("import.importing") : t("import.confirmImport")}
            </Button>
            {importType === "expense" && !targetOpenPeriodId && (
              <div className="text-xs text-amber-700 dark:text-amber-400">{t("importExport.noOpenPeriod")}</div>
            )}
            {importSummary && (
              <div className="text-sm text-green-700 dark:text-green-400">
                {t("import.summary.total")}: {importSummary.totalRows} · {t("import.summary.imported")}: {importSummary.imported} · {t("import.summary.skipped")}: {importSummary.skipped} · {t("import.summary.failed")}: {importSummary.failed}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h2 className="text-lg font-semibold">{t("importExport.exportTemplates")}</h2>
        <p className="text-sm text-gray-500">{t("importExport.templateHelp")}</p>
        <div className="grid md:grid-cols-3 gap-2">
          <AppSelect value={templateType} onChange={(e) => setTemplateType(e.target.value as ImportEntityType)} className="h-10">
            <option value="expense">{t("import.type.expense")}</option>
            <option value="recurring">{t("import.type.recurring")}</option>
          </AppSelect>
          <AppSelect value={templateFormat} onChange={(e) => setTemplateFormat(e.target.value as SpreadsheetFormat)} className="h-10">
            <option value="csv">CSV</option>
            <option value="xlsx">XLSX</option>
            <option value="ods">ODS</option>
          </AppSelect>
          <Button onClick={() => downloadImportTemplate(templateType, templateFormat)}>{t("import.downloadTemplate")}</Button>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h2 className="text-lg font-semibold">{t("importExport.backup")}</h2>
        <p className="text-sm text-gray-500">{t("importExport.backupDescription")}</p>
        <Button onClick={() => void exportBackup()}>{t("importExport.exportBackup")}</Button>
        {backupInfo && <div className="text-sm text-green-700 dark:text-green-400">{backupInfo}</div>}
        {backupError && <div className="text-sm text-red-700 dark:text-red-400">{backupError}</div>}
      </section>

      <section className="rounded-xl border border-red-300 dark:border-red-800 bg-red-50/60 dark:bg-red-950/20 p-4 space-y-3">
        <h2 className="text-lg font-semibold text-red-800 dark:text-red-300">{t("importExport.restore")}</h2>
        <p className="text-sm text-red-700 dark:text-red-300">{t("importExport.restoreWarning")}</p>
        <input type="file" accept="application/json,.json" className="h-10 text-sm" onChange={(e) => void onBackupUpload(e.target.files?.[0])} />
        {restorePreview && (
          <div className="rounded-lg border border-red-300 dark:border-red-700 p-3 text-sm space-y-1">
            <div>{t("importExport.preview.periods")}: {restorePreview.counts.periods}</div>
            <div>{t("importExport.preview.expenses")}: {restorePreview.counts.expenses}</div>
            <div>{t("importExport.preview.recurring")}: {restorePreview.counts.recurringExpenses}</div>
            <div>{t("importExport.preview.categories")}: {restorePreview.counts.categories}</div>
            <div>{t("importExport.preview.paymentMethods")}: {restorePreview.counts.paymentMethods}</div>
            <div>{t("importExport.preview.vendors")}: {restorePreview.counts.vendors}</div>
            <ul className="list-disc pl-5 mt-2">
              {restorePreview.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
        <Button variant="danger" disabled={!backupBundle || isRestoring} onClick={() => void confirmRestore()}>
          {isRestoring ? t("importExport.restoring") : t("importExport.confirmRestore")}
        </Button>
        {restoreSummary && (
          <div className="text-sm text-red-800 dark:text-red-300">
            {t("import.summary.imported")}: {restoreSummary.imported} · {t("import.summary.skipped")}: {restoreSummary.skipped} · {t("import.summary.failed")}: {restoreSummary.failed}
          </div>
        )}
      </section>
    </div>
  );
}
