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

function updateManifest(appTitle: string, background: string, base: string) {
  const manifest = {
    name: appTitle,
    short_name: appTitle,
    description: "Shared expense tracking application",
    lang: "nb-NO",
    dir: "ltr",
    theme_color: background,
    background_color: background,
    display: "standalone",
    orientation: "portrait",
    scope: "/",
    start_url: "/",
    icons: [
      {
        src: `${base}/pwa-192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: `${base}/pwa-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };

  const blob = new Blob([JSON.stringify(manifest)], {
    type: "application/manifest+json",
  });
  const manifestUrl = URL.createObjectURL(blob);
  const manifestLink =
    document.querySelector<HTMLLinkElement>('link[rel="manifest"]') ??
    document.createElement("link");
  manifestLink.rel = "manifest";
  manifestLink.href = manifestUrl;
  if (!manifestLink.parentElement) {
    document.head.appendChild(manifestLink);
  }
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
    const base = `${runtime.data.assetBase}?v=${Date.now()}`;
    upsertLinkTag("icon", `${runtime.data.assetBase}/favicon-32.png?v=${Date.now()}`);
    upsertLinkTag(
      "apple-touch-icon",
      `${runtime.data.assetBase}/apple-180.png?v=${Date.now()}`,
      "180x180",
    );
    upsertLinkTag("icon", `${runtime.data.assetBase}/pwa-192.png?v=${Date.now()}`, "192x192");
    upsertLinkTag("icon", `${runtime.data.assetBase}/pwa-512.png?v=${Date.now()}`, "512x512");
    updateManifest(appTitle, getCurrentIconBackground(branding), runtime.data.assetBase);
  } catch {
    const fallbackLogo = getDefaultLogoUrl();
    upsertLinkTag("icon", fallbackLogo);
    upsertLinkTag("shortcut icon", fallbackLogo);
    upsertLinkTag("apple-touch-icon", fallbackLogo, "180x180");
  }
}

export async function renderIconDataUrl(logoSrc: string, _background?: string, _size?: number): Promise<string> {
  return logoSrc;
}

export async function generateBrandingIconBundle(branding?: BrandingVisualConfig) {
  const src = getCurrentLogo(branding);
  return {
    favicon32: src,
    apple180: src,
    pwa192: src,
    pwa512: src,
  };
}
