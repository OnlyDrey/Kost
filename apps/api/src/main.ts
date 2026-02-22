import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { join } from "path";
import { mkdirSync } from "fs";
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

  // Security (allow same-site image loading from /uploads)
  app.use(helmet({ crossOriginResourcePolicy: { policy: "same-site" } }));
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: configService.get("app.url"),
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix("api");

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
