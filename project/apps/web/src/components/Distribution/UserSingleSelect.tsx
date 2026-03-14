import type { User } from "../../services/api";
import DistributionUserRow from "./DistributionUserRow";

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
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</p>
      ) : null}
      {users.map((user) => {
        const selected = value === user.id;
        return (
          <DistributionUserRow
            key={user.id}
            user={user}
            selected={selected}
            onToggle={onChange}
            ariaLabel={`${title ?? "Select user"}: ${user.name}`}
            roleLabel={roleLabel(user.role)}
            indicatorType="radio"
          />
        );
      })}
    </div>
  );
}
