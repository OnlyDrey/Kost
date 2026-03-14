import {
  DEFAULT_CANONICAL_ICON_BACKGROUND,
  getCurrentIconBackground,
  getCurrentLogoSource,
  getDefaultLogoUrl,
  type BrandingVisualConfig,
} from "../branding/brandingAssets";
import { familyApi } from "../services/api";

export const DEFAULT_PROJECT_LOGO_SRC = getDefaultLogoUrl();
export const DEFAULT_APP_ICON_BACKGROUND = DEFAULT_CANONICAL_ICON_BACKGROUND;

const HEX_COLOR_REGEX = /^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export function isValidHexColor(value: string) {
  return HEX_COLOR_REGEX.test(value.trim());
}

export function resolveAppIconBackground(color?: string) {
  if (!color) return DEFAULT_APP_ICON_BACKGROUND;
  return isValidHexColor(color)
    ? color.trim().toUpperCase()
    : DEFAULT_APP_ICON_BACKGROUND;
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

function upsertLinkTag(rel: string, href: string, sizes?: string) {
  const head = document.head;
  const selector = `link[rel="${rel}"]${sizes ? `[sizes="${sizes}"]` : ""}`;
  let link = head.querySelector<HTMLLinkElement>(selector);
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    if (sizes) link.sizes = sizes;
    head.appendChild(link);
  }
  link.href = href;
}

function upsertManifest(href: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "manifest";
    document.head.appendChild(link);
  }
  link.href = href;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = src;
  });
}

export async function renderIconDataUrl(
  logoSrc: string,
  background = DEFAULT_APP_ICON_BACKGROUND,
  size = 192,
): Promise<string> {
  const image = await loadImage(logoSrc);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

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

export async function generateBrandingIconBundle(branding?: BrandingVisualConfig) {
  const logoSource = getCurrentLogoSource(branding).src;
  const background = getCurrentIconBackground(branding);
  return {
    favicon32: await renderIconDataUrl(logoSource, background, 32),
    apple180: await renderIconDataUrl(logoSource, background, 180),
    pwa192: await renderIconDataUrl(logoSource, background, 192),
    pwa512: await renderIconDataUrl(logoSource, background, 512),
  };
}

export async function applyBrandingIcons(branding?: BrandingVisualConfig) {
  if (typeof document === "undefined") return;

  const appTitle = branding?.appTitle?.trim() || "Kost";
  document.title = appTitle;
  const webAppTitle = document.querySelector<HTMLMetaElement>(
    'meta[name="apple-mobile-web-app-title"]',
  );
  if (webAppTitle) webAppTitle.content = appTitle;

  try {
    const runtime = await familyApi.getBranding();
    const { assetBase, previewIconUrl, manifestUrl, version } = runtime.data;

    upsertLinkTag("icon", `${assetBase}/favicon-32.png?v=${version}`);
    upsertLinkTag("shortcut icon", `${assetBase}/favicon-32.png?v=${version}`);
    upsertLinkTag("apple-touch-icon", `${assetBase}/apple-180.png?v=${version}`, "180x180");
    upsertLinkTag("icon", `${assetBase}/pwa-192.png?v=${version}`, "192x192");
    upsertLinkTag("icon", `${assetBase}/pwa-512.png?v=${version}`, "512x512");
    upsertManifest(manifestUrl);

    if (import.meta.env.DEV) {
      console.info("[BrandingIcons] runtime assets applied", {
        version,
        previewIconUrl,
      });
    }
  } catch {
    const fallbackLogo = getDefaultLogoUrl();
    upsertLinkTag("icon", fallbackLogo);
    upsertLinkTag("shortcut icon", fallbackLogo);
    upsertLinkTag("apple-touch-icon", fallbackLogo, "180x180");
  }
}
