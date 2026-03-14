import type { LucideIcon } from "lucide-react";
import { Button } from "../ui/button";

type ImportTemplateCardProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  buttonLabel: string;
  onDownload: () => void;
};

export default function ImportTemplateCard({
  icon: Icon,
  title,
  description,
  buttonLabel,
  onDownload,
}: ImportTemplateCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-primary" />
        <h3 className="font-medium">{title}</h3>
      </div>
      {description && <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>}
      <Button variant="secondary" className="w-full" onClick={onDownload}>{buttonLabel}</Button>
    </div>
  );
}
