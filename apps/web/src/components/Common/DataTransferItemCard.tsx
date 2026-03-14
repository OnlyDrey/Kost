import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type DataTransferItemCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actions: ReactNode;
};

export default function DataTransferItemCard({
  icon: Icon,
  title,
  description,
  actions,
}: DataTransferItemCardProps) {
  return (
    <article className="rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-gray-50/40 dark:bg-slate-900/35 p-4">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary">
          <Icon size={16} />
        </span>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <div className="mt-3">{actions}</div>
    </article>
  );
}
