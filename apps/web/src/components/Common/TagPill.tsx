import type { ReactNode } from "react";

interface TagPillProps {
  label: string;
  variant?: "type" | "category" | "frequency" | "danger" | "success";
  shape?: "pill" | "rounded";
  size?: "sm" | "md";
  icon?: ReactNode;
}

const variantClass: Record<NonNullable<TagPillProps["variant"]>, string> = {
  type: "bg-muted text-muted-foreground",
  category: "bg-muted text-muted-foreground",
  frequency: "bg-secondary text-secondary-foreground",
  danger: "bg-red-500 text-white",
  success: "bg-green-500 text-white",
};

export default function TagPill({
  label,
  variant = "category",
  shape = "pill",
  size = "sm",
  icon,
}: TagPillProps) {
  const shapeClass = {
    pill: "rounded-full",
    rounded: "rounded-lg",
  };

  const sizeClass = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-3 py-2 text-sm gap-1.5",
  };

  return (
    <span
      className={`inline-flex items-center font-medium leading-none ${shapeClass[shape]} ${sizeClass[size]} ${variantClass[variant]}`}
    >
      {icon ? (
        <span className="inline-flex items-center justify-center">{icon}</span>
      ) : null}
      <span>{label}</span>
    </span>
  );
}
