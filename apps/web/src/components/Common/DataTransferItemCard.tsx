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
    <div className="rounded-xl border border-gray-200/60 dark:border-gray-700/50 bg-transparent p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-primary" />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="pt-1">{actions}</div>
    </div>
  );
}
