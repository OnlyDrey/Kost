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

const STATIC_ICON_PATHS = {
  manifest: "/manifest.webmanifest",
  faviconSvg: "/favicon.svg",
  apple180: "/apple-touch-icon.png",
  pwa192: "/pwa-192x192.png",
  pwa512: "/pwa-512x512.png",
} as const;

const MANAGED_BRANDING_ATTR = "data-kost-branding-managed";

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

function upsertLinkTag(
  rel: string,
  href: string,
  options?: { sizes?: string; type?: string; purpose?: string },
) {
  const head = document.head;
  const sizes = options?.sizes;
  const purpose = options?.purpose;
  const selector = `link[rel="${rel}"]${sizes ? `[sizes="${sizes}"]` : ""}${purpose ? `[purpose="${purpose}"]` : ""}[${MANAGED_BRANDING_ATTR}="true"]`;
  let link = head.querySelector<HTMLLinkElement>(selector);
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    if (sizes) link.sizes = sizes;
    if (purpose) link.setAttribute("purpose", purpose);
    link.setAttribute(MANAGED_BRANDING_ATTR, "true");
    head.appendChild(link);
  }

  if (purpose) {
    link.setAttribute("purpose", purpose);
  } else {
    link.removeAttribute("purpose");
  }

  if (options?.type) {
    link.type = options.type;
  } else {
    link.removeAttribute("type");
  }

  link.href = href;
}

function upsertManifest(href: string) {
  let link = document.querySelector<HTMLLinkElement>(
    `link[rel="manifest"][${MANAGED_BRANDING_ATTR}="true"]`,
  );
  if (!link) {
    link = document.createElement("link");
    link.rel = "manifest";
    link.setAttribute(MANAGED_BRANDING_ATTR, "true");
    document.head.appendChild(link);
  }
  link.href = href;
}

function clearLegacyBrandingLinks() {
  const rels = ["icon", "shortcut icon", "apple-touch-icon", "manifest"];
  for (const rel of rels) {
    const links = Array.from(document.head.querySelectorAll<HTMLLinkElement>(`link[rel="${rel}"]`));
    links
      .filter((link) => link.getAttribute(MANAGED_BRANDING_ATTR) !== "true")
      .forEach((link) => link.remove());
  }
}

function applyStaticIconLinks() {
  clearLegacyBrandingLinks();
  upsertLinkTag("icon", STATIC_ICON_PATHS.faviconSvg, { type: "image/svg+xml" });
  upsertLinkTag("shortcut icon", STATIC_ICON_PATHS.faviconSvg, {
    type: "image/svg+xml",
  });
  upsertLinkTag("apple-touch-icon", STATIC_ICON_PATHS.apple180, {
    sizes: "180x180",
    type: "image/png",
  });
  upsertLinkTag("icon", STATIC_ICON_PATHS.pwa192, {
    sizes: "192x192",
    type: "image/png",
  });
  upsertLinkTag("icon", STATIC_ICON_PATHS.pwa512, {
    sizes: "512x512",
    type: "image/png",
  });
  upsertManifest(STATIC_ICON_PATHS.manifest);
}

function logBrandingDiagnostics(payload: Record<string, unknown>) {
  if (import.meta.env.DEV || import.meta.env.VITE_DEBUG_MODE === "true") {
    console.info("[BrandingRuntime] icon pipeline", payload);
  }
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
    const {
      manifestUrl,
      favicon16Url,
      favicon32Url,
      shortcutIconUrl,
      appleTouchIconUrl,
      pwa192Url,
      pwa512Url,
      pwa192MaskableUrl,
      pwa512MaskableUrl,
      isRuntimeIconOverride,
    } = runtime.data;

    logBrandingDiagnostics({
      isRuntimeIconOverride,
      manifestUrl,
      favicon16Url,
      favicon32Url,
      shortcutIconUrl,
      appleTouchIconUrl,
      pwa192Url,
      pwa512Url,
      pwa192MaskableUrl,
      pwa512MaskableUrl,
      version: runtime.data.version,
    });

    if (!isRuntimeIconOverride) {
      applyStaticIconLinks();
      return;
    }

    clearLegacyBrandingLinks();

    upsertLinkTag("icon", favicon16Url || favicon32Url || STATIC_ICON_PATHS.faviconSvg, {
      sizes: "16x16",
      type: "image/png",
    });
    upsertLinkTag("icon", favicon32Url || STATIC_ICON_PATHS.faviconSvg, {
      sizes: "32x32",
      type: "image/png",
    });
    upsertLinkTag("shortcut icon", shortcutIconUrl || favicon32Url || STATIC_ICON_PATHS.faviconSvg, {
      type: "image/png",
    });
    upsertLinkTag("apple-touch-icon", appleTouchIconUrl || pwa192Url || STATIC_ICON_PATHS.apple180, {
      sizes: "180x180",
      type: "image/png",
    });
    upsertLinkTag("icon", pwa192Url || STATIC_ICON_PATHS.pwa192, {
      sizes: "192x192",
      type: "image/png",
    });
    upsertLinkTag("icon", pwa512Url || STATIC_ICON_PATHS.pwa512, {
      sizes: "512x512",
      type: "image/png",
    });
    upsertLinkTag("icon", pwa192MaskableUrl || pwa192Url || STATIC_ICON_PATHS.pwa192, {
      sizes: "192x192",
      type: "image/png",
      purpose: "maskable",
    });
    upsertLinkTag("icon", pwa512MaskableUrl || pwa512Url || STATIC_ICON_PATHS.pwa512, {
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    });
    upsertManifest(manifestUrl);
  } catch {
    logBrandingDiagnostics({
      isRuntimeIconOverride: false,
      fallback: "static",
      reason: "familyApi.getBranding failed",
    });
    applyStaticIconLinks();
  }
}
