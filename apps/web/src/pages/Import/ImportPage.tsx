import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { DatabaseBackup, Download, Upload } from "lucide-react";
import AppSelect from "../../components/Common/AppSelect";
import { Button } from "../../components/ui/button";
import { TabButton, TabsRow } from "../../components/ui/tabs";
import {
  buildRestorePreview,
  downloadFullBackup,
  exportFullBackup,
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
import {
  buildExpenseImportSpec,
  buildRecurringImportSpec,
} from "../../features/import/specs";
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
  usePaymentMethods,
  usePeriods,
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

  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  const [backupInfo, setBackupInfo] = useState("");
  const [backupError, setBackupError] = useState("");
  const [backupBundle, setBackupBundle] = useState<BackupBundle | null>(null);
  const [selectedBackupFile, setSelectedBackupFile] = useState<File | null>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  const [restoreSummary, setRestoreSummary] = useState<RestoreSummary | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [activeTab, setActiveTab] = useState<"input" | "output" | "backup">("input");
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [autoBackupFrequency, setAutoBackupFrequency] = useState<"daily" | "weekly">("daily");
  const [autoBackupRetention, setAutoBackupRetention] = useState(5);
  const [lastAutoBackupAt, setLastAutoBackupAt] = useState<string | null>(null);

  const { data: categories = [] } = useCategories();
  const { data: vendors = [] } = useVendors();
  const { data: paymentMethods = [] } = usePaymentMethods();
  const { data: currentPeriod } = useCurrentPeriod();
  const { data: periods = [] } = usePeriods();

  const targetOpenPeriodId =
    (currentPeriod && currentPeriod.status === "OPEN"
      ? currentPeriod.id
      : periods.find((period) => period.status === "OPEN")?.id) ?? "";

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

  const uploadSpreadsheet = async () => {
    if (!selectedImportFile) return;
    const parsed = await parseSpreadsheet(selectedImportFile);
    setParsedHeaders(parsed.headers);
    setRows(parsed.rows);
    setPreview(null);
    setImportSummary(null);
    setMapping(suggestColumnMapping(parsed.headers, importSpec.fields));
  };

  const generatePreview = () => {
    setPreview(buildPreview(rows, importSpec as never, mapping));
    setImportSummary(null);
  };

  const confirmImport = async () => {
    if (!preview) return;
    setIsImporting(true);
    try {
      setImportSummary(await executeImport(preview, importSpec as never));
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

  const onBackupFileSelected = async (file?: File) => {
    if (!file) return;
    setSelectedBackupFile(file);
    setBackupError("");
    setRestoreSummary(null);
    try {
      setBackupBundle(await parseBackupFile(file));
    } catch {
      setBackupBundle(null);
      setBackupError(t("importExport.invalidBackup"));
    }
  };

  const confirmRestore = async () => {
    if (!backupBundle) return;
    setIsRestoring(true);
    try {
      setRestoreSummary(await restoreFromBackup(backupBundle));
    } finally {
      setIsRestoring(false);
    }
  };

  const restorePreview = useMemo(
    () => (backupBundle ? buildRestorePreview(backupBundle) : null),
    [backupBundle],
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem("autoBackupSettings");
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        enabled?: boolean;
        frequency?: "daily" | "weekly";
        retention?: number;
        lastRunAt?: string | null;
      };
      setAutoBackupEnabled(Boolean(parsed.enabled));
      if (parsed.frequency === "daily" || parsed.frequency === "weekly") {
        setAutoBackupFrequency(parsed.frequency);
      }
      if (typeof parsed.retention === "number") {
        setAutoBackupRetention(Math.max(1, Math.min(30, parsed.retention)));
      }
      if (parsed.lastRunAt) setLastAutoBackupAt(parsed.lastRunAt);
    } catch {
      // ignore invalid local config
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "autoBackupSettings",
      JSON.stringify({
        enabled: autoBackupEnabled,
        frequency: autoBackupFrequency,
        retention: autoBackupRetention,
        lastRunAt: lastAutoBackupAt,
      }),
    );
  }, [autoBackupEnabled, autoBackupFrequency, autoBackupRetention, lastAutoBackupAt]);

  useEffect(() => {
    if (!autoBackupEnabled) return;

    const runIfNeeded = async () => {
      const now = Date.now();
      const last = lastAutoBackupAt ? new Date(lastAutoBackupAt).getTime() : 0;
      const intervalMs = autoBackupFrequency === "daily" ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
      if (last && now - last < intervalMs) return;

      try {
        const bundle = await exportFullBackup(settings);
        const existing = JSON.parse(localStorage.getItem("autoBackups") || "[]") as Array<{ id: string; exportedAt: string; bundle: unknown }>;
        const next = [
          { id: `ab_${Date.now()}`, exportedAt: bundle.metadata.exportedAt, bundle },
          ...existing,
        ].slice(0, autoBackupRetention);
        localStorage.setItem("autoBackups", JSON.stringify(next));
        setLastAutoBackupAt(bundle.metadata.exportedAt);
      } catch {
        // silent fail for background autobackup
      }
    };

    void runIfNeeded();
    const timer = window.setInterval(() => {
      void runIfNeeded();
    }, 60 * 1000);

    return () => window.clearInterval(timer);
  }, [autoBackupEnabled, autoBackupFrequency, autoBackupRetention, lastAutoBackupAt, settings]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {t("importExport.title")}
      </h1>

      <div className="overflow-x-auto pb-1">
        <TabsRow>
          <TabButton active={activeTab === "input"} icon={<Upload size={16} />} onClick={() => setActiveTab("input")}>
            {t("importExport.tabInput")}
          </TabButton>
          <TabButton active={activeTab === "output"} icon={<Download size={16} />} onClick={() => setActiveTab("output")}>
            {t("importExport.tabOutput")}
          </TabButton>
          <TabButton active={activeTab === "backup"} icon={<DatabaseBackup size={16} />} onClick={() => setActiveTab("backup")}>
            {t("importExport.tabBackup")}
          </TabButton>
        </TabsRow>
      </div>

      {activeTab === "input" && <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-4">
        <h2 className="text-lg font-semibold">{t("importExport.importData")}</h2>

        <input
          ref={importFileInputRef}
          type="file"
          accept=".csv,.xlsx,.ods"
          className="hidden"
          onChange={(e) => setSelectedImportFile(e.target.files?.[0] ?? null)}
        />

        <div className="grid grid-cols-2 gap-2">
          <AppSelect
            value={importType}
            onChange={(e) => setImportType(e.target.value as ImportEntityType)}
            className="h-10"
          >
            <option value="expense">{t("import.type.expense")}</option>
            <option value="recurring">{t("import.type.recurring")}</option>
          </AppSelect>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => importFileInputRef.current?.click()}
          >
            {t("importExport.chooseFile")}
          </Button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          {selectedImportFile
            ? `${t("importExport.selectedFile")}: ${selectedImportFile.name}`
            : t("importExport.noFileSelected")}
        </p>

        {selectedImportFile && (
          <Button className="w-full sm:w-auto" onClick={() => void uploadSpreadsheet()}>
            {t("importExport.uploadFile")}
          </Button>
        )}

        {parsedHeaders.length > 0 && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 space-y-3">
            <div className="text-sm font-semibold">{t("import.detectedColumns")}</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {importSpec.fields.map((field) => (
                <div key={field.key} className="grid grid-cols-2 items-center gap-2">
                  <label className="text-xs text-gray-600 dark:text-gray-300">
                    {t(field.labelKey)}{" "}
                    {field.required
                      ? `(${t("common.required")})`
                      : `(${t("common.optional")})`}
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
            <Button className="w-full sm:w-auto" onClick={generatePreview}>
              {t("import.generatePreview")}
            </Button>
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
                    <tr
                      key={row.sourceRowNumber}
                      className="border-t border-gray-200 dark:border-gray-700"
                    >
                      <td className="px-2 py-1">{row.sourceRowNumber}</td>
                      <td className="px-2 py-1">{row.severity}</td>
                      <td className="px-2 py-1">
                        {row.issues.map((issue, idx) => (
                          <div key={idx}>{issue.message}</div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button
              className="w-full sm:w-auto"
              disabled={
                isImporting || (importType === "expense" && !targetOpenPeriodId)
              }
              onClick={() => void confirmImport()}
            >
              {isImporting ? t("import.importing") : t("import.confirmImport")}
            </Button>
            {importType === "expense" && !targetOpenPeriodId && (
              <div className="text-xs text-amber-700 dark:text-amber-400">
                {t("importExport.noOpenPeriod")}
              </div>
            )}
            {importSummary && (
              <div className="text-sm text-green-700 dark:text-green-400">
                {t("import.summary.total")}: {importSummary.totalRows} · {t("import.summary.imported")}: {importSummary.imported} · {t("import.summary.skipped")}: {importSummary.skipped} · {t("import.summary.failed")}: {importSummary.failed}
              </div>
            )}
          </div>
        )}
      </section>}

      {activeTab === "output" && <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-4">
        <h2 className="text-lg font-semibold">{t("importExport.exportTemplates")}</h2>
        <p className="text-sm text-gray-500">{t("importExport.templateHelp")}</p>
        <div className="grid grid-cols-2 gap-2">
          <AppSelect
            value={templateType}
            onChange={(e) => setTemplateType(e.target.value as ImportEntityType)}
            className="h-10"
          >
            <option value="expense">{t("import.type.expense")}</option>
            <option value="recurring">{t("import.type.recurring")}</option>
          </AppSelect>
          <AppSelect
            value={templateFormat}
            onChange={(e) => setTemplateFormat(e.target.value as SpreadsheetFormat)}
            className="h-10"
          >
            <option value="csv">CSV</option>
            <option value="xlsx">XLSX</option>
            <option value="ods">ODS</option>
          </AppSelect>
          <div className="col-span-2">
            <Button
              className="w-full sm:w-auto"
              onClick={() => downloadImportTemplate(templateType, templateFormat)}
            >
              {t("import.downloadTemplate")}
            </Button>
          </div>
        </div>
      </section>}

      {activeTab === "backup" && <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h2 className="text-lg font-semibold">{t("importExport.backup")}</h2>
        <p className="text-sm text-gray-500">{t("importExport.backupDescription")}</p>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">{t("importExport.autoBackup")}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t("importExport.autoBackupHelp")}</p>
            </div>
            <input
              type="checkbox"
              checked={autoBackupEnabled}
              onChange={(e) => setAutoBackupEnabled(e.target.checked)}
              className="h-4 w-4"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <AppSelect value={autoBackupFrequency} onChange={(e) => setAutoBackupFrequency(e.target.value as "daily" | "weekly")}>
              <option value="daily">{t("importExport.autoBackupDaily")}</option>
              <option value="weekly">{t("importExport.autoBackupWeekly")}</option>
            </AppSelect>
            <input
              type="number"
              min={1}
              max={30}
              value={autoBackupRetention}
              onChange={(e) => setAutoBackupRetention(Math.max(1, Math.min(30, Number(e.target.value || "1"))))}
              className="h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm"
              placeholder={t("importExport.retentionCopies")}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("importExport.backupStorageHint")}{lastAutoBackupAt ? ` · ${t("importExport.lastAutoBackup")}: ${new Date(lastAutoBackupAt).toLocaleString()}` : ""}
          </p>
        </div>

        <Button className="w-full sm:w-auto" onClick={() => void exportBackup()}>
          {t("importExport.exportBackup")}
        </Button>
        {backupInfo && (
          <div className="text-sm text-green-700 dark:text-green-400">
            {backupInfo}
          </div>
        )}
        {backupError && (
          <div className="text-sm text-red-700 dark:text-red-400">
            {backupError}
          </div>
        )}
      </section>}

      {activeTab === "backup" && <section className="rounded-xl border border-red-300 dark:border-red-800 bg-red-50/60 dark:bg-red-950/20 p-4 space-y-3">
        <h2 className="text-lg font-semibold text-red-800 dark:text-red-300">
          {t("importExport.restore")}
        </h2>
        <p className="text-sm text-red-700 dark:text-red-300">
          {t("importExport.restoreWarning")}
        </p>

        <input
          ref={backupFileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => void onBackupFileSelected(e.target.files?.[0])}
        />

        <Button
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={() => backupFileInputRef.current?.click()}
        >
          {t("importExport.chooseFile")}
        </Button>

        <p className="text-xs text-red-700 dark:text-red-300">
          {selectedBackupFile
            ? `${t("importExport.selectedFile")}: ${selectedBackupFile.name}`
            : t("importExport.noFileSelected")}
        </p>

        {restorePreview && (
          <div className="rounded-lg border border-red-300 dark:border-red-700 p-3 text-sm space-y-1">
            <div>
              {t("importExport.preview.periods")}: {restorePreview.counts.periods}
            </div>
            <div>
              {t("importExport.preview.expenses")}: {restorePreview.counts.expenses}
            </div>
            <div>
              {t("importExport.preview.recurring")}: {restorePreview.counts.recurringExpenses}
            </div>
            <div>
              {t("importExport.preview.categories")}: {restorePreview.counts.categories}
            </div>
            <div>
              {t("importExport.preview.paymentMethods")}: {restorePreview.counts.paymentMethods}
            </div>
            <div>
              {t("importExport.preview.vendors")}: {restorePreview.counts.vendors}
            </div>
            <ul className="list-disc pl-5 mt-2">
              {restorePreview.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {selectedBackupFile && (
          <Button
            className="w-full sm:w-auto"
            variant="danger"
            disabled={!backupBundle || isRestoring}
            onClick={() => void confirmRestore()}
          >
            {isRestoring
              ? t("importExport.restoring")
              : t("importExport.confirmRestore")}
          </Button>
        )}

        {restoreSummary && (
          <div className="text-sm text-red-800 dark:text-red-300">
            {t("import.summary.imported")}: {restoreSummary.imported} · {t("import.summary.skipped")}: {restoreSummary.skipped} · {t("import.summary.failed")}: {restoreSummary.failed}
          </div>
        )}
      </section>}
    </div>
  );
}
