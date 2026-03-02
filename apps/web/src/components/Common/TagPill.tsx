import type { ReactNode } from "react";

interface TagPillProps {
  label: string;
  variant?: "type" | "category" | "frequency" | "danger" | "success";
  shape?: "pill" | "rounded";
  size?: "sm" | "md";
  icon?: ReactNode;
}

const variantClass: Record<NonNullable<TagPillProps["variant"]>, string> = {
  type: "bg-blue-300 text-blue-950",
  category: "bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100",
  frequency: "bg-sky-300 text-sky-950",
  danger: "bg-red-300 text-red-950",
  success: "bg-green-300 text-green-950",
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
