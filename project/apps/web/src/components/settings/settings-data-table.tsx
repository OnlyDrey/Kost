import type { ReactNode } from "react";
import { Pagination } from "../ui/pagination";

export function SettingsDataTable<T>({
  rows,
  renderRow,
  page,
  pageCount,
  onPageChange,
  emptyState,
}: {
  rows: T[];
  renderRow: (row: T) => ReactNode;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  emptyState: ReactNode;
}) {
  if (!rows.length) return <>{emptyState}</>;

  return (
    <>
      <div className="space-y-2">{rows.map((row) => renderRow(row))}</div>
      <Pagination page={page} pageCount={pageCount} onPageChange={onPageChange} />
    </>
  );
}
