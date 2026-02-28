const defaultAppUrl = "http://localhost:3000";

const normalizeOrigin = (origin: string) => {
  const trimmed = origin.trim();

  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed.replace(/\/+$/, "");
  }
};

export default () => {
  const corsOrigins = [
    process.env.CORS_ORIGIN,
    process.env.APP_URL,
    defaultAppUrl,
  ]
    .filter(Boolean)
    .join(",")
    .split(",")
    .map((origin) => normalizeOrigin(origin))
    .filter((origin): origin is string => Boolean(origin));

  const uniqueCorsOrigins = [...new Set(corsOrigins)];

  return {
    port: parseInt(process.env.PORT || "3000", 10),
    nodeEnv: process.env.NODE_ENV || "development",
    database: {
      url: process.env.DATABASE_URL,
    },
    jwt: {
      secret: process.env.JWT_SECRET || "change-me-in-production",
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
    app: {
      url: process.env.APP_URL || defaultAppUrl,
    },
    cors: {
      origins: uniqueCorsOrigins,
      allowPrivateNetwork: process.env.CORS_ALLOW_PRIVATE_NETWORK !== "false",
    },
    health: {
      // Keep strict web bundle validation enabled in production-like container runs,
      // but allow API-only test/dev contexts (e2e/unit) to skip it.
      requireWebAssets: process.env.HEALTH_REQUIRE_WEB_ASSETS === "true",
    },
    // Set COOKIE_SECURE=true only when serving over HTTPS.
    // When running behind HTTP (e.g. local Docker without TLS), keep false.
    cookieSecure: process.env.COOKIE_SECURE === "true",
    rateLimit: {
      ttl: parseInt(process.env.RATE_LIMIT_TTL || "60", 10),
      max: parseInt(process.env.RATE_LIMIT_MAX || "120", 10),
    },
  };
};
