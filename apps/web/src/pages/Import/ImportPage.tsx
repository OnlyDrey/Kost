import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BadgeDollarSign,
  DatabaseBackup,
  Download,
  FileDown,
  FileUp,
  FolderSync,
  Scale,
  Layers,
  ListTree,
  Receipt,
  Repeat,
  Tags,
  Upload,
  type LucideIcon,
} from "lucide-react";
import AppSelect from "../../components/Common/AppSelect";
import { Button } from "../../components/ui/button";
import { Switch } from "../../components/ui/switch";
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
} from "../../features/import/types";
import {
  useCategories,
  useCurrentPeriod,
  usePaymentMethods,
  usePeriods,
  useVendors,
} from "../../hooks/useApi";
import { familyApi, invoiceApi, subscriptionApi } from "../../services/api";
import ExportCard from "../../components/Common/ExportCard";
import ImportCard from "../../components/Common/ImportCard";
import BackupListItem from "../../components/Common/BackupListItem";
import { useSettings } from "../../stores/settings.context";

type ImportCardType =
  | "expense"
  | "recurring"
  | "vendors"
  | "categories"
  | "paymentMethods";

interface StoredBackup {
  id: string;
  name: string;
  exportedAt: string;
  bundle: BackupBundle;
}

function formatBackupName(dateValue: string) {
  const date = new Date(dateValue);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `kost-backup-${y}-${m}-${d}-${hh}${mm}`;
}

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    const raw = String(value ?? "");
    return /[",\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
  };

  return [
    headers.join(","),
    ...rows.map((row) => headers.map((key) => escape(row[key])).join(",")),
  ].join("\n");
}

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadListTemplate(
  type: "vendors" | "categories" | "paymentMethods",
) {
  const headersByType: Record<typeof type, string> = {
    vendors: "name",
    categories: "name",
    paymentMethods: "name",
  };

  downloadBlob(
    `${headersByType[type]}\n`,
    `${type}-import-template.csv`,
    "text/csv;charset=utf-8",
  );
}

async function parseSimpleListFile(file: File): Promise<string[]> {
  const text = await file.text();
  if (file.name.toLowerCase().endsWith(".json")) {
    const parsed = JSON.parse(text) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => String(item).trim()).filter(Boolean);
  }

  return text
    .split(/\r?\n/)
    .map((line) => line.trim().split(",")[0]?.trim())
    .filter(Boolean);
}

export default function ImportPage() {
  const { t } = useTranslation();
  const { settings } = useSettings();

  const [importType, setImportType] = useState<ImportEntityType>("expense");
  const [selectedImportCard, setSelectedImportCard] =
    useState<ImportCardType | null>(null);
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(
    null,
  );
  const [importInfo, setImportInfo] = useState("");

  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string | undefined>>(
    {},
  );
  const [preview, setPreview] = useState<ImportPreview<unknown> | null>(null);
  const [importSummary, setImportSummary] =
    useState<ImportExecutionSummary | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const [backupInfo, setBackupInfo] = useState("");
  const [backupError, setBackupError] = useState("");
  const [backupBundle, setBackupBundle] = useState<BackupBundle | null>(null);
  const [selectedBackupFile, setSelectedBackupFile] = useState<File | null>(
    null,
  );
  const [restoreSummary, setRestoreSummary] = useState<RestoreSummary | null>(
    null,
  );
  const [isRestoring, setIsRestoring] = useState(false);

  const [activeTab, setActiveTab] = useState<"input" | "output" | "backup">(
    "input",
  );
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [autoBackupFrequency, setAutoBackupFrequency] = useState<
    "daily" | "weekly"
  >("daily");
  const [autoBackupRetention, setAutoBackupRetention] = useState(5);
  const [lastAutoBackupAt, setLastAutoBackupAt] = useState<string | null>(null);
  const [storedBackups, setStoredBackups] = useState<StoredBackup[]>([]);

  const importFileInputRef = useRef<HTMLInputElement>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);

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

  const restorePreview = useMemo(
    () => (backupBundle ? buildRestorePreview(backupBundle) : null),
    [backupBundle],
  );

  const importCards: Array<{
    key: ImportCardType;
    icon: LucideIcon;
    titleKey: string;
    descKey: string;
  }> = [
    {
      key: "expense",
      icon: Receipt,
      titleKey: "importExport.cardExpenses",
      descKey: "importExport.importExpensesDesc",
    },
    {
      key: "recurring",
      icon: Repeat,
      titleKey: "importExport.cardRecurring",
      descKey: "importExport.importRecurringDesc",
    },
    {
      key: "vendors",
      icon: ListTree,
      titleKey: "importExport.cardVendors",
      descKey: "importExport.importVendorsDesc",
    },
    {
      key: "categories",
      icon: Tags,
      titleKey: "importExport.cardCategories",
      descKey: "importExport.importCategoriesDesc",
    },
    {
      key: "paymentMethods",
      icon: BadgeDollarSign,
      titleKey: "importExport.cardPaymentMethods",
      descKey: "importExport.importPaymentMethodsDesc",
    },
  ];

  const exportCards = [
    {
      key: "expenses",
      icon: Receipt,
      titleKey: "importExport.cardExpenses",
      descKey: "importExport.exportExpensesDesc",
    },
    {
      key: "recurring",
      icon: Repeat,
      titleKey: "importExport.cardRecurring",
      descKey: "importExport.exportRecurringDesc",
    },
    {
      key: "settlements",
      icon: Scale,
      titleKey: "importExport.cardSettlement",
      descKey: "importExport.exportSettlementDesc",
    },
    {
      key: "masterdata",
      icon: Layers,
      titleKey: "importExport.cardMasterdata",
      descKey: "importExport.exportMasterdataDesc",
    },
  ] as const;

  const downloadTemplateForCard = (card: ImportCardType) => {
    if (card === "expense" || card === "recurring") {
      downloadImportTemplate(card, "xlsx");
      return;
    }

    if (
      card === "vendors" ||
      card === "categories" ||
      card === "paymentMethods"
    ) {
      downloadListTemplate(card);
    }
  };

  const loadStoredBackups = () => {
    const existing = JSON.parse(
      localStorage.getItem("autoBackups") || "[]",
    ) as StoredBackup[];
    setStoredBackups(existing);
  };

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

    loadStoredBackups();
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
  }, [
    autoBackupEnabled,
    autoBackupFrequency,
    autoBackupRetention,
    lastAutoBackupAt,
  ]);

  useEffect(() => {
    if (!autoBackupEnabled) return;

    const runIfNeeded = async () => {
      const now = Date.now();
      const last = lastAutoBackupAt ? new Date(lastAutoBackupAt).getTime() : 0;
      const intervalMs =
        autoBackupFrequency === "daily"
          ? 24 * 60 * 60 * 1000
          : 7 * 24 * 60 * 60 * 1000;
      if (last && now - last < intervalMs) return;

      try {
        const bundle = await exportFullBackup(settings);
        const existing = JSON.parse(
          localStorage.getItem("autoBackups") || "[]",
        ) as StoredBackup[];
        const next = [
          {
            id: `ab_${Date.now()}`,
            name: formatBackupName(bundle.metadata.exportedAt),
            exportedAt: bundle.metadata.exportedAt,
            bundle,
          },
          ...existing,
        ].slice(0, autoBackupRetention);
        localStorage.setItem("autoBackups", JSON.stringify(next));
        setLastAutoBackupAt(bundle.metadata.exportedAt);
        setStoredBackups(next);
      } catch {
        // ignore background failure
      }
    };

    void runIfNeeded();
    const timer = window.setInterval(() => {
      void runIfNeeded();
    }, 60 * 1000);

    return () => window.clearInterval(timer);
  }, [
    autoBackupEnabled,
    autoBackupFrequency,
    autoBackupRetention,
    lastAutoBackupAt,
    settings,
  ]);

  const handleImportCardFile = async (file?: File | null) => {
    if (!file || !selectedImportCard) return;
    setSelectedImportFile(file);
    setImportInfo("");
    setImportSummary(null);
    setPreview(null);

    if (
      selectedImportCard === "expense" ||
      selectedImportCard === "recurring"
    ) {
      const type = selectedImportCard === "expense" ? "expense" : "recurring";
      setImportType(type);
      const parsed = await parseSpreadsheet(file);
      setParsedHeaders(parsed.headers);
      setRows(parsed.rows);
      setMapping(
        suggestColumnMapping(parsed.headers, importSpec.fields as any),
      );
      setImportInfo(t("importExport.fileLoadedForPreview"));
      return;
    }

    const values = await parseSimpleListFile(file);
    let imported = 0;

    if (selectedImportCard === "categories") {
      for (const value of values) {
        try {
          await familyApi.addCategory(value);
          imported += 1;
        } catch {
          // ignore duplicates
        }
      }
    } else if (selectedImportCard === "paymentMethods") {
      for (const value of values) {
        try {
          await familyApi.addPaymentMethod(value);
          imported += 1;
        } catch {
          // ignore duplicates
        }
      }
    } else if (selectedImportCard === "vendors") {
      for (const value of values) {
        try {
          await familyApi.addVendor(value);
          imported += 1;
        } catch {
          // ignore duplicates
        }
      }
    }

    setImportInfo(t("importExport.simpleImportDone", { count: imported }));
  };

  const generatePreview = () => {
    setPreview(buildPreview(rows, importSpec as never, mapping));
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

  const exportDataset = async (
    dataset: "expenses" | "recurring" | "settlements" | "masterdata",
    format: "csv" | "json",
  ) => {
    const backup = await exportFullBackup(settings);
    let payload: unknown[] = [];

    if (dataset === "expenses") {
      payload = (await invoiceApi.getAll().then((res) => res.data)).map(
        (item) => ({
          periodId: item.periodId,
          description: item.description,
          totalCents: item.totalCents,
          category: item.category,
          vendor: item.vendor,
        }),
      );
    } else if (dataset === "recurring") {
      payload = (await subscriptionApi.getAll().then((res) => res.data)).map(
        (item) => ({
          name: item.name,
          vendor: item.vendor,
          amountCents: item.amountCents,
          frequency: item.frequency,
          active: item.active,
        }),
      );
    } else if (dataset === "settlements") {
      payload = backup.data.periods
        .map((period) => ({
          periodId: period.id,
          settlementData: period.settlementData ?? null,
        }))
        .filter((item) => item.settlementData);
    } else {
      payload = [
        {
          categories: backup.data.categories,
          paymentMethods: backup.data.paymentMethods,
          vendors: backup.data.vendors.map((vendor) => vendor.name),
        },
      ];
    }

    if (format === "json") {
      downloadBlob(
        JSON.stringify(payload, null, 2),
        `kost-${dataset}.json`,
        "application/json;charset=utf-8",
      );
      return;
    }

    const rows = payload as Record<string, unknown>[];
    downloadBlob(toCsv(rows), `kost-${dataset}.csv`, "text/csv;charset=utf-8");
  };

  const createBackupNow = async () => {
    setBackupInfo("");
    setBackupError("");
    try {
      const bundle = await downloadFullBackup(settings);
      const existing = JSON.parse(
        localStorage.getItem("autoBackups") || "[]",
      ) as StoredBackup[];
      const next = [
        {
          id: `manual_${Date.now()}`,
          name: formatBackupName(bundle.metadata.exportedAt),
          exportedAt: bundle.metadata.exportedAt,
          bundle,
        },
        ...existing,
      ].slice(0, autoBackupRetention);
      localStorage.setItem("autoBackups", JSON.stringify(next));
      setStoredBackups(next);
      setBackupInfo(
        `${t("importExport.backupExportedAt")}: ${bundle.metadata.exportedAt}`,
      );
    } catch {
      setBackupError(t("importExport.backupExportFailed"));
    }
  };

  const downloadStoredBackup = (item: StoredBackup) => {
    downloadBlob(
      JSON.stringify(item.bundle, null, 2),
      `${item.name ?? formatBackupName(item.exportedAt)}.json`,
      "application/json;charset=utf-8",
    );
  };

  const restoreStoredBackup = async (item: StoredBackup) => {
    setIsRestoring(true);
    try {
      setRestoreSummary(await restoreFromBackup(item.bundle));
    } finally {
      setIsRestoring(false);
    }
  };

  const deleteStoredBackup = (id: string) => {
    const next = storedBackups.filter((item) => item.id !== id);
    setStoredBackups(next);
    localStorage.setItem("autoBackups", JSON.stringify(next));
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {t("data.title")}
      </h1>

      <div className="overflow-x-auto pb-1">
        <TabsRow>
          <TabButton
            active={activeTab === "input"}
            icon={<Upload size={16} />}
            onClick={() => setActiveTab("input")}
          >
            {t("data.tabImport")}
          </TabButton>
          <TabButton
            active={activeTab === "output"}
            icon={<Download size={16} />}
            onClick={() => setActiveTab("output")}
          >
            {t("data.tabExport")}
          </TabButton>
          <TabButton
            active={activeTab === "backup"}
            icon={<DatabaseBackup size={16} />}
            onClick={() => setActiveTab("backup")}
          >
            {t("data.tabBackup")}
          </TabButton>
        </TabsRow>
      </div>

      {activeTab === "input" && (
        <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <FileUp size={18} className="text-primary" />
            <h2 className="text-lg font-semibold">{t("data.tabImport")}</h2>
          </div>

          <input
            ref={importFileInputRef}
            type="file"
            accept=".csv,.xlsx,.ods,.json"
            className="hidden"
            onChange={(e) => void handleImportCardFile(e.target.files?.[0])}
          />

          <div className="grid sm:grid-cols-2 gap-3">
            {importCards.map((card) => {
              const Icon = card.icon;
              return (
                <ImportCard
                  key={card.key}
                  icon={Icon}
                  title={t(card.titleKey)}
                  description={t(card.descKey)}
                  chooseFileLabel={t("importExport.chooseFile")}
                  templateLabel={t("data.downloadTemplate")}
                  onChooseFile={() => {
                    setSelectedImportCard(card.key);
                    importFileInputRef.current?.click();
                  }}
                  onDownloadTemplate={() => downloadTemplateForCard(card.key)}
                />
              );
            })}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            {selectedImportFile
              ? `${t("importExport.selectedFile")}: ${selectedImportFile.name}`
              : t("importExport.noFileSelected")}
          </p>
          {importInfo && (
            <p className="text-sm text-green-600 dark:text-green-400">
              {importInfo}
            </p>
          )}

          {(selectedImportCard === "expense" ||
            selectedImportCard === "recurring") &&
            parsedHeaders.length > 0 && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-3">
                <div className="text-sm font-semibold">
                  {t("import.detectedColumns")}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {importSpec.fields.map((field) => (
                    <div
                      key={field.key}
                      className="grid grid-cols-2 items-center gap-2"
                    >
                      <label className="text-xs text-gray-600 dark:text-gray-300">
                        {t(field.labelKey)}
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
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-3">
              <div className="text-sm">
                {t("import.counts.total")}: {preview.counts.total} ·{" "}
                {t("import.counts.valid")}: {preview.counts.valid} ·{" "}
                {t("import.counts.warnings")}: {preview.counts.warnings} ·{" "}
                {t("import.counts.errors")}: {preview.counts.errors}
              </div>
              <Button
                className="w-full sm:w-auto"
                disabled={
                  isImporting ||
                  (importType === "expense" && !targetOpenPeriodId)
                }
                onClick={() => void confirmImport()}
              >
                {isImporting
                  ? t("import.importing")
                  : t("import.confirmImport")}
              </Button>
              {importSummary && (
                <div className="text-sm text-green-700 dark:text-green-400">
                  {t("import.summary.imported")}: {importSummary.imported} ·{" "}
                  {t("import.summary.skipped")}: {importSummary.skipped} ·{" "}
                  {t("import.summary.failed")}: {importSummary.failed}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {activeTab === "output" && (
        <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <FileDown size={18} className="text-primary" />
            <h2 className="text-lg font-semibold">{t("data.tabExport")}</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {exportCards.map((card) => (
              <ExportCard
                key={card.key}
                icon={card.icon}
                title={t(card.titleKey)}
                description={t(card.descKey)}
                csvLabel={t("data.exportCsv")}
                jsonLabel={t("data.exportJson")}
                onExportCsv={() => void exportDataset(card.key, "csv")}
                onExportJson={() => void exportDataset(card.key, "json")}
              />
            ))}
          </div>
        </section>
      )}

      {activeTab === "backup" && (
        <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FolderSync size={18} className="text-primary" />
            <h2 className="text-lg font-semibold">{t("data.tabBackup")}</h2>
          </div>
          <p className="text-sm text-gray-500">
            {t("importExport.backupDescription")}
          </p>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">
                  {t("importExport.autoBackup")}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("importExport.autoBackupHelp")}
                </p>
              </div>
              <Switch
                checked={autoBackupEnabled}
                onCheckedChange={setAutoBackupEnabled}
                aria-label={t("importExport.autoBackup")}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <AppSelect
                value={autoBackupFrequency}
                onChange={(e) =>
                  setAutoBackupFrequency(e.target.value as "daily" | "weekly")
                }
              >
                <option value="daily">
                  {t("importExport.autoBackupDaily")}
                </option>
                <option value="weekly">
                  {t("importExport.autoBackupWeekly")}
                </option>
              </AppSelect>
              <input
                type="number"
                min={1}
                max={30}
                value={autoBackupRetention}
                onChange={(e) =>
                  setAutoBackupRetention(
                    Math.max(1, Math.min(30, Number(e.target.value || "1"))),
                  )
                }
                className="h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm"
                placeholder={t("importExport.retentionCopies")}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("importExport.backupStorageHint")}
              {lastAutoBackupAt
                ? ` · ${t("importExport.lastAutoBackup")}: ${new Date(lastAutoBackupAt).toLocaleString()}`
                : ""}
            </p>
          </div>

          <Button
            className="w-full sm:w-auto"
            onClick={() => void createBackupNow()}
          >
            {t("data.createBackup")}
          </Button>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
            <h3 className="font-medium">{t("data.backupList")}</h3>
            {storedBackups.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("data.noBackups")}
              </p>
            ) : (
              <div className="space-y-2">
                {storedBackups.map((item) => (
                  <BackupListItem
                    key={item.id}
                    nameText={item.name ?? formatBackupName(item.exportedAt)}
                    dateText={new Date(item.exportedAt).toLocaleString(
                      "nb-NO",
                      { dateStyle: "long", timeStyle: "short" },
                    )}
                    downloadLabel={t("data.download")}
                    restoreLabel={t("data.restore")}
                    deleteLabel={t("data.delete")}
                    onDownload={() => downloadStoredBackup(item)}
                    onRestore={() => void restoreStoredBackup(item)}
                    onDelete={() => deleteStoredBackup(item.id)}
                    restoring={isRestoring}
                  />
                ))}
              </div>
            )}
          </div>

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

          <section className="rounded-xl border border-red-300 dark:border-red-800 bg-red-50/60 dark:bg-red-950/20 p-4 space-y-3">
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
                  {t("importExport.preview.periods")}:{" "}
                  {restorePreview.counts.periods}
                </div>
                <div>
                  {t("importExport.preview.expenses")}:{" "}
                  {restorePreview.counts.expenses}
                </div>
                <div>
                  {t("importExport.preview.recurring")}:{" "}
                  {restorePreview.counts.recurringExpenses}
                </div>
                <div>
                  {t("importExport.preview.categories")}:{" "}
                  {restorePreview.counts.categories}
                </div>
                <div>
                  {t("importExport.preview.paymentMethods")}:{" "}
                  {restorePreview.counts.paymentMethods}
                </div>
                <div>
                  {t("importExport.preview.vendors")}:{" "}
                  {restorePreview.counts.vendors}
                </div>
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
                {t("import.summary.imported")}: {restoreSummary.imported} ·{" "}
                {t("import.summary.skipped")}: {restoreSummary.skipped} ·{" "}
                {t("import.summary.failed")}: {restoreSummary.failed}
              </div>
            )}
          </section>
        </section>
      )}
    </div>
  );
}
