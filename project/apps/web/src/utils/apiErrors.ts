import type { TFunction } from "i18next";

export function getApiErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return undefined;
  }

  const response = (error as { response?: { data?: { code?: unknown } } }).response;
  const code = response?.data?.code;
  return typeof code === "string" ? code : undefined;
}

export function getApiErrorMessage(t: TFunction, error: unknown): string {
  const code = getApiErrorCode(error);
  if (code) {
    const key = `errors.${code}`;
    const translated = t(key);
    if (translated !== key) return translated;
  }

  return t("errors.UNKNOWN");
}
