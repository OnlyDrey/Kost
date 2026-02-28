import type { User } from "../../services/api";
import type { ReactNode } from "react";
import DistributionUserRow from "./DistributionUserRow";

export default function UserSelectionCards({
  users,
  selectedIds,
  onToggle,
  ariaLabel,
  inlineContent,
  secondaryContent,
  roleLabel,
}: {
  users: User[];
  selectedIds: Set<string>;
  onToggle: (userId: string) => void;
  ariaLabel: (user: User, selected: boolean) => string;
  inlineContent?: (user: User, selected: boolean) => ReactNode;
  secondaryContent?: (user: User, selected: boolean) => ReactNode;
  roleLabel: (role: User["role"]) => string;
}) {
  return (
    <div className="space-y-2">
      {users.map((u) => {
        const selected = selectedIds.has(u.id);
        return (
          <DistributionUserRow
            key={u.id}
            user={u}
            selected={selected}
            onToggle={onToggle}
            ariaLabel={ariaLabel(u, selected)}
            roleLabel={roleLabel(u.role)}
            inlineContent={inlineContent?.(u, selected)}
            secondaryContent={secondaryContent?.(u, selected)}
          />
        );
      })}
    </div>
  );
}
