import { useCurrencyFormatter } from "../../hooks/useApi";
import { FOCUS_RING } from "../Common/focusStyles";

interface ShareItem {
  id: string;
  userId: string;
  shareCents: number;
  user?: { name: string };
}

export default function UserSharesGrid({
  shares,
  totalCents,
  currency: _currency,
  emptyLabel,
  unknownLabel,
  onSelectShare,
  selectedUserId,
}: {
  shares: ShareItem[];
  totalCents: number;
  currency: string;
  emptyLabel: string;
  unknownLabel: string;
  onSelectShare?: (userId: string) => void;
  selectedUserId?: string;
}) {
  const fmt = useCurrencyFormatter();

  if (!shares.length) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">{emptyLabel}</p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {shares.map((share) => {
        const selected = selectedUserId === share.userId;
        const cls = `border rounded-lg p-3 text-left ${selected ? "border-primary/50 dark:border-primary" : "border-gray-200 dark:border-gray-700"} ${onSelectShare ? "hover:border-primary/40 dark:hover:border-primary/40 cursor-pointer" : ""}`;
        return onSelectShare ? (
          <button
            key={share.id}
            type="button"
            onClick={() => onSelectShare(share.userId)}
            className={`${cls} ${FOCUS_RING}`}
          >
            <p className="font-medium text-primary text-sm">
              {share.user?.name || unknownLabel}
            </p>
            <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {fmt(share.shareCents)}
            </p>
            {totalCents > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {((share.shareCents / totalCents) * 100).toFixed(1)}%
              </p>
            )}
          </button>
        ) : (
          <div key={share.id} className={`${cls} ${FOCUS_RING}`}>
            <p className="font-medium text-primary text-sm">
              {share.user?.name || unknownLabel}
            </p>
            <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {fmt(share.shareCents)}
            </p>
            {totalCents > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {((share.shareCents / totalCents) * 100).toFixed(1)}%
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
