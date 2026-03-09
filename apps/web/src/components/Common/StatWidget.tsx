import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type StatWidgetProps = {
  icon: LucideIcon;
  title: string;
  value: ReactNode;
  colorClass: string;
};

export default function StatWidget({ icon: Icon, title, value, colorClass }: StatWidgetProps) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-white ${colorClass}`}>
          <Icon size={17} />
        </span>
        <span className="text-sm font-medium leading-tight">{title}</span>
      </div>
      <div className="mt-3 text-4xl font-semibold text-gray-900 dark:text-gray-100">{value}</div>
    </div>
  );
}
