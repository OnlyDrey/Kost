import { Download, RotateCcw, Trash2 } from "lucide-react";
import ActionIconBar from "./ActionIconBar";

type BackupListItemProps = {
  nameText: string;
  dateText: string;
  downloadLabel: string;
  restoreLabel: string;
  deleteLabel: string;
  onDownload: () => void;
  onRestore: () => void;
  onDelete: () => void;
  restoring?: boolean;
};

export default function BackupListItem({
  nameText,
  dateText,
  downloadLabel,
  restoreLabel,
  deleteLabel,
  onDownload,
  onRestore,
  onDelete,
  restoring,
}: BackupListItemProps) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-sm space-y-3">
      <div>
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {nameText}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {dateText}
        </div>
      </div>
      <ActionIconBar
        showLabelFromMd
        items={[
          {
            key: "download",
            icon: Download,
            label: downloadLabel,
            onClick: onDownload,
            colorClassName: "bg-primary text-white hover:bg-primary/90",
          },
          {
            key: "restore",
            icon: RotateCcw,
            label: restoreLabel,
            onClick: onRestore,
            disabled: restoring,
            colorClassName: "bg-violet-500 text-white hover:bg-violet-400",
          },
          {
            key: "delete",
            icon: Trash2,
            label: deleteLabel,
            onClick: onDelete,
            colorClassName: "bg-danger text-white hover:bg-danger/90",
          },
        ]}
      />
    </div>
  );
}
