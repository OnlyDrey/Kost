import { Store } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
  const [hasImageError, setHasImageError] = useState(false);
  const containerSize = size === "sm" ? "h-10 w-10" : "h-12 w-12";
  const iconSize = size === "sm" ? 16 : 18;
  const normalizedLogoUrl = useMemo(() => logoUrl?.trim() ?? "", [logoUrl]);

  useEffect(() => {
    setHasImageError(false);
  }, [normalizedLogoUrl]);

  if (show !== true) return null;

  if (normalizedLogoUrl && !hasImageError) {
    return (
      <img
        src={normalizedLogoUrl}
        alt={vendorName}
        className={`${containerSize} rounded-md object-contain object-center bg-white border border-gray-200 dark:border-gray-700 flex-shrink-0`}
        onError={() => setHasImageError(true)}
      />
    );
  }

  return (
    <div
      className={`${containerSize} rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0`}
      aria-hidden
    >
      <Store size={iconSize} className="text-gray-400 dark:text-gray-500" />
    </div>
  );
}
