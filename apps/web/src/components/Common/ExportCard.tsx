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
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
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
