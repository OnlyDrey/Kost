import { Button } from "../ui/button";

type BackupListItemProps = {
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
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-2 text-sm">
      <div>{dateText}</div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button className="text-primary text-sm font-medium" onClick={onDownload}>{downloadLabel}</button>
        <button className="text-primary text-sm font-medium" onClick={onRestore} disabled={restoring}>{restoreLabel}</button>
        <Button variant="danger" className="h-8 rounded-full px-3" onClick={onDelete}>{deleteLabel}</Button>
      </div>
    </div>
  );
}
