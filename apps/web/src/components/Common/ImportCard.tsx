import type { LucideIcon } from "lucide-react";
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
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-primary" />
        <h3 className="font-medium">{title}</h3>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      <div className="space-y-2">
        <Button variant="secondary" className="w-full" onClick={onChooseFile}>
          {chooseFileLabel}
        </Button>
        {templateLabel && onDownloadTemplate && (
          <Button
            variant="secondary"
            className="w-full"
            onClick={onDownloadTemplate}
          >
            {templateLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
