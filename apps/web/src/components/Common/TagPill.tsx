import type { ReactNode } from "react";

interface TagPillProps {
  label: string;
  variant?:
    | "type"
    | "category"
    | "frequency"
    | "danger"
    | "success"
    | "admin"
    | "adult"
    | "child"
    | "warning";
  shape?: "pill" | "rounded";
  size?: "sm" | "md";
  icon?: ReactNode;
}

const variantClass: Record<NonNullable<TagPillProps["variant"]>, string> = {
  type: "bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-500/30",
  category: "bg-slate-500/15 text-slate-200 ring-1 ring-slate-500/20",
  frequency: "bg-violet-500/20 text-violet-200 ring-1 ring-violet-500/30",
  danger: "bg-red-500 text-white",
  success: "bg-green-500 text-white",
  admin: "bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/30",
  adult: "bg-sky-500/20 text-sky-200 ring-1 ring-sky-500/30",
  child: "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-500/30",
  warning: "bg-amber-500/70 text-white",
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
