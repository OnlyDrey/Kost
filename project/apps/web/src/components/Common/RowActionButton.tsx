import type { ReactNode } from "react";
import { IconButton } from "../ui/icon-button";

type RowActionButtonProps = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "edit" | "delete" | "neutral";
};

export default function RowActionButton({
  label,
  icon,
  onClick,
  disabled,
  tone = "neutral",
}: RowActionButtonProps) {
  const toneClasses =
    tone === "edit"
      ? "border-violet-500/45 bg-violet-500/20 text-violet-300"
      : tone === "delete"
        ? "border-red-500/45 bg-red-500/20 text-red-300"
        : "";

  return (
    <IconButton
      onClick={onClick}
      disabled={disabled}
      size="md"
      variant={tone === "delete" ? "danger" : tone === "edit" ? "violet" : "neutral"}
      className={toneClasses}
      aria-label={label}
    >
      {icon}
    </IconButton>
  );
}
