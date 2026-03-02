import { Baby, ShieldCheck, UsersRound } from "lucide-react";
import type { User } from "../../services/api";

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
  const variant =
    role === "ADMIN"
      ? "bg-sky-600/20 text-sky-300 ring-1 ring-sky-600/30"
      : role === "CHILD"
        ? "bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/30"
        : "bg-slate-500/20 text-slate-200 ring-1 ring-slate-500/30";

  const Icon = role === "ADMIN" ? ShieldCheck : role === "CHILD" ? Baby : UsersRound;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${variant} ${className}`.trim()}
      title={label}
      aria-label={label}
    >
      <Icon size={11} />
      {showLabelOnDesktop ? <span className="hidden md:inline">{label}</span> : null}
    </span>
  );
}
