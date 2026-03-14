import AppSelect from "./AppSelect";

type UserOption = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

interface UserPickerSelectProps {
  label: string;
  value: string;
  users: UserOption[];
  placeholder: string;
  onChange: (value: string) => void;
}

function UserAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />;
  }

  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-app-muted text-[11px] font-semibold text-app-text-secondary">
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

export default function UserPickerSelect({
  label,
  value,
  users,
  placeholder,
  onChange,
}: UserPickerSelectProps) {
  const selectedUser = users.find((user) => user.id === value);

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-app-text-secondary">{label}</label>
      <AppSelect value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{placeholder}</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </AppSelect>
      {selectedUser ? (
        <div className="inline-flex items-center gap-2 rounded-lg border border-app-border bg-app-muted/30 px-2 py-1 text-xs text-app-text-primary">
          <UserAvatar name={selectedUser.name} avatarUrl={selectedUser.avatarUrl} />
          <span className="font-medium">{selectedUser.name}</span>
        </div>
      ) : null}
    </div>
  );
}
