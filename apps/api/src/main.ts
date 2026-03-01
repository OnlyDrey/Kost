import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { join } from "path";
import { mkdirSync, existsSync } from "fs";
import * as express from "express";
import type { Request, Response, NextFunction } from "express";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Ensure upload directories exist (pre-created in Docker; this is a no-op if they already exist)
  for (const dir of ["avatars", "vendors"]) {
    try {
      mkdirSync(join(process.cwd(), "uploads", dir), { recursive: true });
    } catch {
      // Directory may already exist or be managed externally — not fatal
    }
  }

  // Security headers FIRST — must run before any static-file middleware so
  // that all responses (HTML, JS, CSS, images, uploads) carry the full set of
  // security headers (CSP, X-Frame-Options, X-Content-Type-Options, etc.).
  // crossOriginResourcePolicy: 'same-site' lets the browser load avatar/logo
  // images that are served from the same origin via /uploads.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "same-site" },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'self'"],
          objectSrc: ["'none'"],
          imgSrc: ["'self'", "data:"],
          styleSrc: ["'self'", "https:", "'unsafe-inline'"],
          fontSrc: ["'self'", "https:", "data:"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          scriptSrcAttr: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
    }),
  );
  const securityProofHeaderMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    res.setHeader("X-Kost-Security", "fix-attempt-01b");
    next();
  };
  app.use(securityProofHeaderMiddleware);
  app.use(cookieParser());

  // Serve uploaded files at /uploads
  app.use("/uploads", express.static(join(process.cwd(), "uploads")));

  // Serve web bundle (single-container deployment mode)
  // index.html MUST NOT be cached by the browser — a stale cached shell that
  // references chunk hashes from a previous deployment causes a blank white
  // screen on iOS Safari (and other browsers) after a redeploy.
  const publicDir = join(process.cwd(), "public");
  const hasPublicBundle = existsSync(publicDir);

  if (!hasPublicBundle) {
    console.error(
      `[startup] Frontend bundle missing at ${publicDir}. Root path (/) will not serve GUI.`,
    );
  }
  if (hasPublicBundle) {
    app.use(
      express.static(publicDir, {
        setHeaders(res, filePath) {
          if (filePath.endsWith("index.html")) {
            res.setHeader(
              "Cache-Control",
              "no-store, no-cache, must-revalidate",
            );
            res.setHeader("Pragma", "no-cache");
            res.setHeader("Expires", "0");
          }
        },
      }),
    );
  }

  // CORS
  const allowedOrigins = configService.get<string[]>("cors.origins") ?? [];
  const normalizeOrigin = (value: string) => {
    try {
      return new URL(value).origin;
    } catch {
      return value.replace(/\/+$/, "");
    }
  };
  const normalizedAllowedOrigins = new Set(
    allowedOrigins.map((origin) => normalizeOrigin(origin)),
  );
  const allowPrivateNetwork =
    configService.get<boolean>("cors.allowPrivateNetwork") ?? true;
  const isPrivateNetworkOrigin = (origin: string) => {
    try {
      const parsed = new URL(origin);
      const host = parsed.hostname;
      const isLocalhost = host === "localhost" || host === "127.0.0.1";
      const isPrivateIp =
        /^10\./.test(host) ||
        /^192\.168\./.test(host) ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);

      return isLocalhost || isPrivateIp;
    } catch {
      return false;
    }
  };

  app.enableCors({
    origin: (origin, callback) => {
      // Allow same-origin and non-browser clients (no Origin header)
      if (!origin) {
        return callback(null, true);
      }

      if (normalizedAllowedOrigins.has(normalizeOrigin(origin))) {
        return callback(null, true);
      }

      if (allowPrivateNetwork && isPrivateNetworkOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix("api");

  // SPA fallback route for frontend paths (excluding /api and /uploads)
  if (hasPublicBundle) {
    app.use((req: Request, res: Response, next: NextFunction): void => {
      if (
        req.method !== "GET" ||
        req.path.startsWith("/api") ||
        req.path.startsWith("/uploads") ||
        req.path.includes(".")
      ) {
        return next();
      }

      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate",
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      return res.sendFile(join(publicDir, "index.html"));
    });
  }

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false, // allow extra fields on multipart forms
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // OpenAPI/Swagger
  const config = new DocumentBuilder()
    .setTitle("Kost API")
    .setDescription("API for shared expense tracking")
    .setVersion("1.0")
    .addBearerAuth()
    .addCookieAuth("jwt")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = configService.get<number>("port") ?? 3000;
  const host = process.env.HOST || "0.0.0.0";
  await app.listen(port, host);

  console.log(`[startup] Listening on http://${host}:${port}`);
  console.log(`[startup] API endpoint: http://${host}:${port}/api`);
  console.log(`[startup] API docs: http://${host}:${port}/api/docs`);
  console.log(`[startup] Web bundle present: ${hasPublicBundle}`);
}

bootstrap();
