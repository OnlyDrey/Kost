import { Baby, ShieldCheck, UsersRound } from "lucide-react";
import type { User } from "../../services/api";

const ROLE_CLASSES: Record<User["role"], string> = {
  ADMIN:
    "bg-blue-100 text-blue-800 ring-1 ring-blue-300 dark:bg-blue-500/20 dark:text-blue-200 dark:ring-blue-500/30",
  ADULT:
    "bg-slate-200 text-slate-800 ring-1 ring-slate-300 dark:bg-slate-500/20 dark:text-slate-200 dark:ring-slate-500/30",
  CHILD:
    "bg-amber-100 text-amber-800 ring-1 ring-amber-300 dark:bg-amber-500/20 dark:text-amber-200 dark:ring-amber-500/30",
};

export default function RoleBadge({
  role,
  label,
  showLabelOnDesktop = true,
  className = "",
}: {
  role: User["role"];
  label: string;
  showLabelOnDesktop?: boolean;
  className?: string;
}) {
  const Icon =
    role === "ADMIN" ? ShieldCheck : role === "CHILD" ? Baby : UsersRound;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_CLASSES[role]} ${className}`.trim()}
      title={label}
      aria-label={label}
    >
      <Icon size={11} />
      {showLabelOnDesktop ? <span className="hidden md:inline">{label}</span> : null}
    </span>
  );
}
