import type { ReactNode } from "react";
import { ListRow } from "../ui/list-row";

type MasterdataRowProps = {
  checked: boolean;
  checkbox: ReactNode;
  content: ReactNode;
  actions: ReactNode;
  className?: string;
};

export default function MasterdataRow({
  checked,
  checkbox,
  content,
  actions,
  className = "",
}: MasterdataRowProps) {
  return (
    <ListRow active={checked}>
      <div className={`flex items-center gap-3 ${className}`.trim()}>
        {checkbox}
        <div className="min-w-0 flex-1">{content}</div>
        <div className="ml-auto flex items-center gap-2">{actions}</div>
      </div>
    </ListRow>
  );
}
