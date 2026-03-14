import StatusChip from "./StatusChip";
import { CONTROL_HEIGHT } from "./focusStyles";

type PeriodStatusBadgeProps = {
  status: "OPEN" | "CLOSED";
  className?: string;
  size?: "sm" | "md";
  variant?: "chip" | "field";
};

export default function PeriodStatusBadge({
  status,
  className = "",
  size = "sm",
  variant = "chip",
}: PeriodStatusBadgeProps) {
  if (variant === "field") {
    return (
      <StatusChip
        status={status}
        size="md"
        className={`${CONTROL_HEIGHT} rounded-lg ${className}`}
      />
    );
  }

  return <StatusChip status={status} size={size} className={className} />;
}
