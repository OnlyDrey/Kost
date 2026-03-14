import { Check } from "lucide-react";
import type { ReactNode } from "react";
import type { User } from "../../services/api";
import RoleBadge from "../Common/RoleBadge";

type IndicatorType = "check" | "radio";

export default function DistributionUserRow({
  user,
  selected,
  onToggle,
  ariaLabel,
  roleLabel,
  inlineContent,
  secondaryContent,
  indicatorType = "check",
}: {
  user: User;
  selected: boolean;
  onToggle: (userId: string) => void;
  roleLabel: string;
  ariaLabel: string;
  inlineContent?: ReactNode;
  secondaryContent?: ReactNode;
  indicatorType?: IndicatorType;
}) {
  const indicator =
    indicatorType === "check" ? (
      <span
        className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
          selected ? "bg-primary border-primary" : "border-gray-400"
        }`}
      >
        {selected && <Check size={13} className="text-white" />}
      </span>
    ) : (
      <span
        className={`h-6 w-6 rounded-full border inline-flex items-center justify-center flex-shrink-0 ${
          selected
            ? "border-primary bg-primary/15"
            : "border-gray-400 dark:border-gray-600"
        }`}
      >
        {selected ? <span className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
      </span>
    );

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={() => onToggle(user.id)}
      className={`w-full rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/60 ${
        selected
          ? "border-primary/50 bg-primary/10"
          : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
      }`}
    >
      <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 bg-primary overflow-hidden">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="min-w-0 flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {user.name}
            </p>
            <RoleBadge role={user.role} label={roleLabel} className="shrink-0" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
            @{user.username}
          </p>
        </div>

        {inlineContent && (
          <div
            className="flex items-center gap-1 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {inlineContent}
          </div>
        )}

        {indicator}
      </div>

      {secondaryContent && (
        <div
          className="mt-1.5 flex justify-end"
          onClick={(e) => e.stopPropagation()}
        >
          {secondaryContent}
        </div>
      )}
    </button>
  );
}
