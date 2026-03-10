import { Download, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "../ui/button";

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
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-sm">
      <div className="font-medium text-gray-900 dark:text-gray-100">
        {nameText}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
        {dateText}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          variant="primary"
          className="h-9 w-9 rounded-full p-0 sm:h-10 sm:w-auto sm:px-4 sm:rounded-full"
          onClick={onDownload}
          icon={<Download size={16} />}
        >
          <span className="hidden sm:inline">{downloadLabel}</span>
        </Button>
        <Button
          variant="secondary"
          className="h-9 w-9 rounded-full p-0 text-primary sm:h-10 sm:w-auto sm:px-4 sm:rounded-full"
          onClick={onRestore}
          disabled={restoring}
          icon={<RotateCcw size={16} />}
        >
          <span className="hidden sm:inline">{restoreLabel}</span>
        </Button>
        <Button
          variant="danger"
          className="h-9 w-9 rounded-full p-0 sm:h-10 sm:w-auto sm:px-4 sm:rounded-full"
          onClick={onDelete}
          icon={<Trash2 size={16} />}
        >
          <span className="hidden sm:inline">{deleteLabel}</span>
        </Button>
      </div>
    </div>
  );
}
