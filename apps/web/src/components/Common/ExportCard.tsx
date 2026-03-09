import type { LucideIcon } from "lucide-react";
import { Button } from "../ui/button";

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
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-primary" />
        <h3 className="font-medium">{title}</h3>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={onExportCsv}>{csvLabel}</Button>
        <Button variant="secondary" onClick={onExportJson}>{jsonLabel}</Button>
      </div>
    </div>
  );
}
