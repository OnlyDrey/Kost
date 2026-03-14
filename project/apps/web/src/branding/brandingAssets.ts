export const DEFAULT_CANONICAL_LOGO_URL = "/apple-touch-icon.png";
export const DEFAULT_CANONICAL_ICON_BACKGROUND = "#0B1020";

const HEX_COLOR_REGEX = /^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export type BrandingVisualConfig = {
  appTitle?: string;
  logoDataUrl?: string;
  logoUrl?: string;
  appIconBackground?: string;
};

export type CurrentLogoSource = {
  type: "default" | "upload" | "url";
  src: string;
};

export function getDefaultLogoUrl(): string {
  return DEFAULT_CANONICAL_LOGO_URL;
}

export function getCurrentLogoSource(
  branding?: BrandingVisualConfig,
): CurrentLogoSource {
  const upload = branding?.logoDataUrl?.trim();
  if (upload) {
    return { type: "upload", src: upload };
  }

  const externalUrl = branding?.logoUrl?.trim();
  if (externalUrl) {
    return { type: "url", src: externalUrl };
  }

  return { type: "default", src: getDefaultLogoUrl() };
}

export function getCurrentIconBackground(branding?: BrandingVisualConfig): string {
  const value = branding?.appIconBackground?.trim() ?? "";
  if (!value || !HEX_COLOR_REGEX.test(value)) {
    return DEFAULT_CANONICAL_ICON_BACKGROUND;
  }
  return value.toUpperCase();
}
