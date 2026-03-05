import type { ReactNode } from "react";

export function ListRow({
  children,
  active = false,
}: {
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-2.5 transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary/70 ${
        active
          ? "border-primary/40 bg-primary/10"
          : "border-transparent bg-gray-50 dark:bg-gray-800 hover:bg-gray-100/70 dark:hover:bg-gray-800/80"
      }`}
    >
      {children}
    </div>
  );
}
