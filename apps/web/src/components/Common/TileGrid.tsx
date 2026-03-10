import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import IconStatCard from "./IconStatCard";

export interface TileItem {
  key: string;
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  colorClass: string;
  iconTextClass?: string;
  onClick?: () => void;
}

export default function TileGrid({
  items,
  gridClassName,
}: {
  items: TileItem[];
  gridClassName?: string;
}) {
  return (
    <div
      className={
        gridClassName ??
        "grid grid-cols-2 min-[700px]:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-2 sm:gap-3"
      }
    >
      {items.map(
        ({ key, icon, label, value, colorClass, iconTextClass, onClick }) => (
          <IconStatCard
            key={key}
            icon={icon}
            label={label}
            value={value}
            iconBgClass={colorClass}
            iconTextClass={iconTextClass}
            onClick={onClick}
          />
        ),
      )}
    </div>
  );
}
