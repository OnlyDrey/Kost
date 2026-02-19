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
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || "60", 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || "10", 10),
  },
});
