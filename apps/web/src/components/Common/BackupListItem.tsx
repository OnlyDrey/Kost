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
    <div className="rounded-xl border border-gray-200/70 bg-slate-50/30 p-4 text-sm dark:border-gray-700/60 dark:bg-slate-900/30">
      <div className="font-semibold text-gray-900 dark:text-gray-100 break-words">
        {nameText}
      </div>

      <div className="mt-2 flex items-start justify-between gap-3">
        <div className="text-sm text-muted-foreground">{dateText}</div>

        <ActionIconBar
          showLabelFromMd
          className="shrink-0 justify-end gap-2"
          items={[
            {
              key: "download",
              icon: Download,
              label: downloadLabel,
              onClick: onDownload,
              colorClassName: "bg-blue-500 text-white hover:bg-blue-400",
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
