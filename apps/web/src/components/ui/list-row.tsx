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
      className={`rounded-lg border px-3 py-2.5 transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-primary/70 ${
        active
          ? "border-primary/40 bg-primary/10"
          : "border-transparent bg-gray-50 dark:bg-gray-800"
      }`}
    >
      {children}
    </div>
  );
}
