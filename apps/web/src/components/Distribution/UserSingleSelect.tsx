import { Baby, Circle, Dot, ShieldCheck, UsersRound } from "lucide-react";
import type { User } from "../../services/api";

function RoleBadge({ role, label }: { role: User["role"]; label: string }) {
  if (role === "ADMIN") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
        <ShieldCheck size={11} /> {label}
      </span>
    );
  }
  if (role === "CHILD") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
        <Baby size={11} /> {label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-200">
      <UsersRound size={11} /> {label}
    </span>
  );
}

export default function UserSingleSelect({
  users,
  value,
  onChange,
  roleLabel,
  title,
}: {
  users: User[];
  value: string;
  onChange: (userId: string) => void;
  roleLabel: (role: User["role"]) => string;
  title?: string;
}) {
  return (
    <div className="space-y-2">
      {title ? (
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {title}
        </p>
      ) : null}
      {users.map((user) => {
        const selected = value === user.id;
        return (
          <button
            key={user.id}
            type="button"
            onClick={() => onChange(user.id)}
            className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
              selected
                ? "border-primary bg-primary/10"
                : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary text-white text-sm font-semibold inline-flex items-center justify-center overflow-hidden">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user.name}
                </p>
                <RoleBadge role={user.role} label={roleLabel(user.role)} />
              </div>
              <span className="text-primary">
                {selected ? <Dot size={22} /> : <Circle size={18} />}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
