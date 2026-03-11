import type { LucideIcon } from "lucide-react";
import DataActionButtons from "./DataActionButtons";

type ExportCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  csvLabel: string;
  jsonLabel: string;
  onExportCsv: () => void;
  onExportJson: () => void;
};

export default function ExportCard({
  icon: Icon,
  title,
  description,
  csvLabel,
  jsonLabel,
  onExportCsv,
  onExportJson,
}: ExportCardProps) {
  return (
    <div className="rounded-xl border border-gray-200/70 dark:border-gray-700/60 bg-slate-50/40 dark:bg-slate-900/35 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-primary" />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      <DataActionButtons
        primaryLabel={csvLabel}
        secondaryLabel={jsonLabel}
        onPrimary={onExportCsv}
        onSecondary={onExportJson}
      />
    </div>
  );
}
