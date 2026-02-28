import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { join } from "path";
import { mkdirSync, existsSync } from "fs";
import * as express from "express";
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

  // Serve uploaded files at /uploads (before global prefix and helmet)
  app.use("/uploads", express.static(join(process.cwd(), "uploads")));

  // Serve web bundle (single-container deployment mode)
  // index.html MUST NOT be cached by the browser — a stale cached shell that
  // references chunk hashes from a previous deployment causes a blank white
  // screen on iOS Safari (and other browsers) after a redeploy.
  const publicDir = join(process.cwd(), "public");
  if (existsSync(publicDir)) {
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

  // Security (allow same-site image loading from /uploads)
  app.use(helmet({ crossOriginResourcePolicy: { policy: "same-site" } }));
  app.use(cookieParser());

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
  if (existsSync(publicDir)) {
    app.use((req, res, next) => {
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

  const port = configService.get<number>("port");
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}/api`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
