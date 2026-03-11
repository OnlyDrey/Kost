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
    <div className="rounded-xl border border-gray-200/70 dark:border-gray-700/60 bg-slate-50/40 dark:bg-slate-900/35 p-4 text-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="truncate font-semibold text-gray-900 dark:text-gray-100">
          {nameText}
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">
          {dateText}
          </div>
        </div>
      </div>
      <div className="mt-3 border-t border-gray-200/60 dark:border-gray-700/60 pt-3">
        <ActionIconBar
          showLabelFromMd
          className="gap-2"
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
    </div>
  );
}
