import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FOCUS_RING } from "../Common/focusStyles";

function buildPageItems(page: number, pageCount: number): (number | "...")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);

  const items: (number | "...")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);

  if (start > 2) items.push("...");
  for (let i = start; i <= end; i += 1) items.push(i);
  if (end < pageCount - 1) items.push("...");

  items.push(pageCount);
  return items;
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  const { t } = useTranslation();

  if (pageCount <= 1) return null;

  const items = buildPageItems(page, pageCount);

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <button
          type="button"
          className={`inline-flex h-9 items-center justify-start gap-1 rounded-md px-2 text-sm text-text-secondary transition-colors hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed ${FOCUS_RING}`}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={16} />
          {t("common.previous")}
        </button>

        <div className="flex items-center justify-center gap-1.5">
          {items.map((item, index) =>
            item === "..." ? (
              <span key={`ellipsis-${index}`} className="px-2 text-sm text-text-secondary">
                ...
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                className={`h-8 min-w-8 rounded-md px-2 text-sm transition-colors ${FOCUS_RING} ${
                  item === page
                    ? "bg-primary/15 text-primary font-semibold"
                    : "text-text-secondary hover:bg-surface-elevated"
                }`}
              >
                {item}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          className={`ml-auto inline-flex h-9 items-center justify-end gap-1 rounded-md px-2 text-sm text-text-secondary transition-colors hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed ${FOCUS_RING}`}
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          {t("common.next")}
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
