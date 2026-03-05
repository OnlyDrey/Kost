import type { Vendor } from "../services/api";

function normalizeVendorName(value: string): string {
  return value.trim().toLowerCase();
}

export function getVendorLogoUrl(
  vendors: Vendor[],
  vendorName: string,
): string {
  const normalized = normalizeVendorName(vendorName);
  return (
    vendors.find((vendor) => normalizeVendorName(vendor.name) === normalized)
      ?.logoUrl ?? ""
  );
}
