export default () => {
  // Auth method flags
  const authPasswordEnabled = process.env.AUTH_PASSWORD_ENABLED !== 'false'; // enabled by default
  const authMagicLinkEnabled = process.env.AUTH_MAGIC_LINK_ENABLED === 'true';
  const authPasskeyEnabled = process.env.AUTH_PASSKEY_ENABLED === 'true';

  // Validate at least one auth method is enabled
  if (!authPasswordEnabled && !authMagicLinkEnabled && !authPasskeyEnabled) {
    throw new Error('At least one authentication method must be enabled');
  }

  return {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    auth: {
      passwordEnabled: authPasswordEnabled,
      magicLinkEnabled: authMagicLinkEnabled,
      passkeyEnabled: authPasskeyEnabled,
    },
    database: {
      url: process.env.DATABASE_URL,
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'change-me-in-production',
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    webauthn: {
      rpName: process.env.WEBAUTHN_RP_NAME || 'Family Finance',
      rpID: process.env.WEBAUTHN_RP_ID || 'localhost',
      origin: process.env.WEBAUTHN_ORIGIN || 'https://localhost',
    },
    smtp: {
      host: authMagicLinkEnabled ? process.env.SMTP_HOST : (process.env.SMTP_HOST || 'smtp.example.com'),
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      user: authMagicLinkEnabled ? process.env.SMTP_USER : process.env.SMTP_USER,
      password: authMagicLinkEnabled ? process.env.SMTP_PASSWORD : process.env.SMTP_PASSWORD,
      from: process.env.SMTP_FROM || 'noreply@familyfinance.local',
    },
    magicLink: {
      secret: process.env.MAGIC_LINK_SECRET || 'change-me-in-production',
      expiresIn: parseInt(process.env.MAGIC_LINK_EXPIRES_IN || '600', 10), // seconds
    },
    app: {
      url: process.env.APP_URL || 'https://localhost',
    },
    rateLimit: {
      ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
      max: parseInt(process.env.RATE_LIMIT_MAX || '10', 10),
    },
  };
};
