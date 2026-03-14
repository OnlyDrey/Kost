import {
  DEFAULT_CANONICAL_ICON_BACKGROUND,
  getCurrentIconBackground,
  getCurrentLogoSource,
  getDefaultLogoUrl,
  type BrandingVisualConfig,
} from "../branding/brandingAssets";

export const DEFAULT_PROJECT_LOGO_SRC = getDefaultLogoUrl();
export const DEFAULT_APP_ICON_BACKGROUND = DEFAULT_CANONICAL_ICON_BACKGROUND;

const HEX_COLOR_REGEX = /^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const ICON_SIZES = {
  favicon: 32,
  appleTouch: 180,
  pwa192: 192,
  pwa512: 512,
} as const;

export function isValidHexColor(value: string) {
  return HEX_COLOR_REGEX.test(value.trim());
}

export function resolveAppIconBackground(color?: string) {
  if (!color) return DEFAULT_APP_ICON_BACKGROUND;
  return isValidHexColor(color) ? color.trim().toUpperCase() : DEFAULT_APP_ICON_BACKGROUND;
}

export function getCurrentLogo(branding?: BrandingVisualConfig) {
  return getCurrentLogoSource(branding).src;
}

export function getFaviconSource(branding?: BrandingVisualConfig) {
  return getCurrentLogo(branding);
}

export function getAppIconSource(branding?: BrandingVisualConfig) {
  return getCurrentLogo(branding);
}

type IconBundle = {
  favicon32: string;
  apple180: string;
  pwa192: string;
  pwa512: string;
};

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
  return link;
}

function updateIconLinks(bundle: IconBundle) {
  const updated: string[] = [];

  const iconLinks = Array.from(
    document.head.querySelectorAll<HTMLLinkElement>('link[rel="icon"]'),
  );
  if (iconLinks.length === 0) {
    upsertLinkTag("icon", bundle.favicon32);
    updated.push('link[rel="icon"] (created)');
  } else {
    iconLinks.forEach((link) => {
      link.href = bundle.favicon32;
      updated.push('link[rel="icon"]');
    });
  }

  upsertLinkTag("shortcut icon", bundle.favicon32);
  updated.push('link[rel="shortcut icon"]');

  upsertLinkTag("apple-touch-icon", bundle.apple180, "180x180");
  updated.push('link[rel="apple-touch-icon"]');

  const maskIcon = document.head.querySelector<HTMLLinkElement>(
    'link[rel="mask-icon"]',
  );
  if (maskIcon) {
    maskIcon.href = bundle.apple180;
    updated.push('link[rel="mask-icon"]');
  }

  upsertLinkTag("icon", bundle.pwa192, "192x192");
  upsertLinkTag("icon", bundle.pwa512, "512x512");
  updated.push('link[rel="icon"][sizes="192x192"]');
  updated.push('link[rel="icon"][sizes="512x512"]');

  return updated;
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

export async function generateBrandingIconBundle(
  branding?: BrandingVisualConfig,
): Promise<IconBundle> {
  const logoSource = getCurrentLogoSource(branding).src;
  const background = getCurrentIconBackground(branding);

  return {
    favicon32: await renderIconDataUrl(logoSource, background, ICON_SIZES.favicon),
    apple180: await renderIconDataUrl(logoSource, background, ICON_SIZES.appleTouch),
    pwa192: await renderIconDataUrl(logoSource, background, ICON_SIZES.pwa192),
    pwa512: await renderIconDataUrl(logoSource, background, ICON_SIZES.pwa512),
  };
}

export async function applyBrandingIcons(branding?: BrandingVisualConfig) {
  if (typeof document === "undefined") return;

  const appTitle = branding?.appTitle?.trim() || "Kost";

  document.title = appTitle;
  const webAppTitle = document.querySelector<HTMLMetaElement>(
    'meta[name="apple-mobile-web-app-title"]',
  );
  if (webAppTitle) {
    webAppTitle.content = appTitle;
  }

  const source = getCurrentLogoSource(branding);

  try {
    const bundle = await generateBrandingIconBundle(branding);
    const updatedLinks = updateIconLinks(bundle);

    if (import.meta.env.DEV) {
      console.info("[BrandingIcons] Applied", {
        logoSourceType: source.type,
        sizes: Object.values(ICON_SIZES),
        links: updatedLinks,
      });
    }
  } catch {
    const fallbackLogo = getDefaultLogoUrl();
    upsertLinkTag("icon", fallbackLogo);
    upsertLinkTag("shortcut icon", fallbackLogo);
    upsertLinkTag("apple-touch-icon", fallbackLogo, "180x180");

    if (import.meta.env.DEV) {
      console.warn("[BrandingIcons] Failed to generate icons, using default logo");
    }
  }
}
