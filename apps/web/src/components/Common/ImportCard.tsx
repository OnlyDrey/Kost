import type { LucideIcon } from "lucide-react";
import DataActionButtons from "./DataActionButtons";
import { Button } from "../ui/button";

type ImportCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  chooseFileLabel: string;
  templateLabel?: string;
  onChooseFile: () => void;
  onDownloadTemplate?: () => void;
};

export default function ImportCard({
  icon: Icon,
  title,
  description,
  chooseFileLabel,
  templateLabel,
  onChooseFile,
  onDownloadTemplate,
}: ImportCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-primary" />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      {templateLabel && onDownloadTemplate ? (
        <DataActionButtons
          primaryLabel={chooseFileLabel}
          secondaryLabel={templateLabel}
          onPrimary={onChooseFile}
          onSecondary={onDownloadTemplate}
        />
      ) : (
        <Button variant="secondary" className="w-full mt-3" onClick={onChooseFile}>
          {chooseFileLabel}
        </Button>
      )}
    </div>
  );
}
