import { Store } from "lucide-react";

interface VendorAvatarProps {
  vendorName: string;
  logoUrl?: string | null;
  show: boolean;
  size?: "sm" | "md";
}

export default function VendorAvatar({
  vendorName,
  logoUrl,
  show,
  size = "md",
}: VendorAvatarProps) {
  const containerSize = size === "sm" ? "h-10 w-10" : "h-12 w-12";
  const iconSize = size === "sm" ? 16 : 18;

  if (show !== true) return null;

  if (logoUrl?.trim()) {
    return (
      <img
        src={logoUrl.trim()}
        alt={vendorName}
        className={`${containerSize} rounded-md object-contain object-center bg-white border border-gray-200 dark:border-gray-700 flex-shrink-0`}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }

  return (
    <div
      className={`${containerSize} rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0`}
      aria-hidden
    >
      <Store
        size={iconSize}
        className={show ? "text-gray-400" : "text-gray-300 dark:text-gray-600"}
      />
    </div>
  );
}
