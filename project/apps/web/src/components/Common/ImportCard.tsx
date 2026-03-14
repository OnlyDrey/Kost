import type { LucideIcon } from "lucide-react";
import DataActionButtons from "./DataActionButtons";
import { Button } from "../ui/button";
import DataTransferItemCard from "./DataTransferItemCard";

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
    <DataTransferItemCard
      icon={Icon}
      title={title}
      description={description}
      actions={
        templateLabel && onDownloadTemplate ? (
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
        )
      }
    />
  );
}
