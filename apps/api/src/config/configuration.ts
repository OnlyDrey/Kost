export default () => ({
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
    url: process.env.APP_URL || "http://localhost:3001",
  },
  // Set COOKIE_SECURE=true only when serving over HTTPS.
  // When running behind HTTP (e.g. local Docker without TLS), keep false.
  cookieSecure: process.env.COOKIE_SECURE === "true",
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || "60", 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || "10", 10),
  },
});
