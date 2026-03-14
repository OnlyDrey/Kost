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
    | "warning"
    | "neutral";
  shape?: "pill" | "rounded";
  size?: "sm" | "md";
  icon?: ReactNode;
}

const variantClass: Record<NonNullable<TagPillProps["variant"]>, string> = {
  type: "bg-indigo-100 text-indigo-800 ring-1 ring-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-200 dark:ring-indigo-500/30",
  category:
    "bg-slate-100 text-slate-700 ring-1 ring-slate-300 dark:bg-slate-500/15 dark:text-slate-200 dark:ring-slate-500/20",
  frequency:
    "bg-violet-100 text-violet-800 ring-1 ring-violet-300 dark:bg-violet-500/20 dark:text-violet-200 dark:ring-violet-500/30",
  danger:
    "bg-red-100 text-red-700 ring-1 ring-red-300 dark:bg-red-500/20 dark:text-red-300 dark:ring-red-500/30",
  success:
    "bg-green-100 text-green-700 ring-1 ring-green-300 dark:bg-green-500/20 dark:text-green-300 dark:ring-green-500/30",
  admin:
    "bg-blue-100 text-blue-800 ring-1 ring-blue-300 dark:bg-blue-500/20 dark:text-blue-200 dark:ring-blue-500/30",
  adult:
    "bg-slate-200 text-slate-800 ring-1 ring-slate-300 dark:bg-slate-500/20 dark:text-slate-200 dark:ring-slate-500/30",
  child:
    "bg-amber-100 text-amber-800 ring-1 ring-amber-300 dark:bg-amber-500/20 dark:text-amber-200 dark:ring-amber-500/30",
  warning:
    "bg-amber-100 text-amber-700 ring-1 ring-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:ring-amber-500/30",
  neutral:
    "bg-gray-100 text-gray-700 ring-1 ring-gray-300 dark:bg-gray-500/20 dark:text-gray-200 dark:ring-gray-500/30",
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
    sm: "px-1.5 py-0.5 text-[11px] gap-1",
    md: "px-3 py-2 text-sm gap-1.5",
  };

  return (
    <span
      className={`inline-flex items-center font-medium leading-none ${shapeClass[shape]} ${sizeClass[size]} ${variantClass[variant]} opacity-90`}
    >
      {icon ? (
        <span className="inline-flex items-center justify-center">{icon}</span>
      ) : null}
      <span>{label}</span>
    </span>
  );
}
