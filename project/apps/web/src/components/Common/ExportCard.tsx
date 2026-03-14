import type { LucideIcon } from "lucide-react";
import DataActionButtons from "./DataActionButtons";
import DataTransferItemCard from "./DataTransferItemCard";

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
    <DataTransferItemCard
      icon={Icon}
      title={title}
      description={description}
      actions={
        <DataActionButtons
          primaryLabel={csvLabel}
          secondaryLabel={jsonLabel}
          onPrimary={onExportCsv}
          onSecondary={onExportJson}
        />
      }
    />
  );
}
