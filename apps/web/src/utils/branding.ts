export const DEFAULT_PROJECT_LOGO_SRC = "/logo-mark.svg";
export const DEFAULT_APP_ICON_BACKGROUND = "#0B1020";

export interface BrandingVisualConfig {
  appTitle?: string;
  logoDataUrl?: string;
  logoUrl?: string;
  appIconBackground?: string;
}

const HEX_COLOR_REGEX = /^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export function isValidHexColor(value: string) {
  return HEX_COLOR_REGEX.test(value.trim());
}

export function resolveAppIconBackground(color?: string) {
  if (!color) return DEFAULT_APP_ICON_BACKGROUND;
  return isValidHexColor(color) ? color.trim() : DEFAULT_APP_ICON_BACKGROUND;
}

export function getCurrentLogo(branding?: BrandingVisualConfig) {
  return (
    branding?.logoDataUrl?.trim() ||
    branding?.logoUrl?.trim() ||
    DEFAULT_PROJECT_LOGO_SRC
  );
}

export function getFaviconSource(branding?: BrandingVisualConfig) {
  return getCurrentLogo(branding);
}

export function getAppIconSource(branding?: BrandingVisualConfig) {
  return getCurrentLogo(branding);
}

function upsertLinkTag(rel: string, href: string, sizes?: string) {
  const head = document.head;
  const selector = `link[rel="${rel}"]${sizes ? `[sizes="${sizes}"]` : ""}`;
  let link = head.querySelector<HTMLLinkElement>(selector);
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    if (sizes) {
      link.sizes = sizes;
    }
    head.appendChild(link);
  }
  link.href = href;
}

function upsertIconLinks(href: string) {
  upsertLinkTag("icon", href);
  upsertLinkTag("shortcut icon", href);
  upsertLinkTag("apple-touch-icon", href, "180x180");

  const maskIcon = document.head.querySelector<HTMLLinkElement>(
    'link[rel="mask-icon"]',
  );
  if (maskIcon) {
    maskIcon.href = href;
  }
}

function isSvgSource(src: string) {
  const lowered = src.toLowerCase();
  return lowered.endsWith(".svg") || lowered.startsWith("data:image/svg");
}

async function normalizeImageSourceForCanvas(src: string): Promise<string> {
  if (!isSvgSource(src) || src.startsWith("data:image/svg")) {
    return src;
  }

  try {
    const response = await fetch(src);
    if (!response.ok) {
      return src;
    }
    const svgText = await response.text();
    const blob = new Blob([svgText], { type: "image/svg+xml" });
    return URL.createObjectURL(blob);
  } catch {
    return src;
  }
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  const normalizedSrc = await normalizeImageSourceForCanvas(src);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = normalizedSrc;
  });
}

export async function renderIconDataUrl(
  logoSrc: string,
  background: string,
  size: number,
): Promise<string> {
  const image = await loadImage(logoSrc);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, size, size);

  const padding = Math.round(size * 0.18);
  const maxWidth = size - padding * 2;
  const maxHeight = size - padding * 2;
  const ratio = Math.min(maxWidth / image.width, maxHeight / image.height);
  const width = image.width * ratio;
  const height = image.height * ratio;
  const x = (size - width) / 2;
  const y = (size - height) / 2;

  ctx.drawImage(image, x, y, width, height);
  return canvas.toDataURL("image/png");
}

export async function applyBrandingIcons(branding?: BrandingVisualConfig) {
  if (typeof document === "undefined") return;

  const appTitle = branding?.appTitle?.trim() || "Kost";
  const logoSrc = getCurrentLogo(branding);
  const iconBackground = resolveAppIconBackground(branding?.appIconBackground);

  document.title = appTitle;
  const webAppTitle = document.querySelector<HTMLMetaElement>(
    'meta[name="apple-mobile-web-app-title"]',
  );
  if (webAppTitle) {
    webAppTitle.content = appTitle;
  }

  try {
    const iconDataUrl = await renderIconDataUrl(logoSrc, iconBackground, 180);
    if (!iconDataUrl.startsWith("data:image/")) {
      throw new Error("Invalid icon data");
    }
    upsertIconLinks(iconDataUrl);
  } catch {
    upsertIconLinks(getFaviconSource(branding));
  }
}
