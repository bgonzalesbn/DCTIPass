import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import cookieParser from "cookie-parser";
import cors from "cors";
import * as express from "express";

// 🔒 Simple Rate Limiter Middleware
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function rateLimitMiddleware(
  _req: express.Request,
  _res: express.Response,
  next: express.NextFunction,
): void {
  const path = _req.path;

  if (path === "/auth/login") {
    const ip = _req.ip || "unknown";
    const now = Date.now();
    const limit = loginAttempts.get(ip);

    // Reset if time window expired
    if (limit && now >= limit.resetAt) {
      loginAttempts.delete(ip);
    }

    // Check limits: 5 attempts per 15 minutes
    if (limit && limit.count >= 5) {
      console.warn(`⚠️  Rate limit exceeded for IP: ${ip}`);
      _res.status(429).json({
        statusCode: 429,
        message: "Too many login attempts. Try again later.",
      });
      return;
    }

    // Increment counter
    if (limit) {
      limit.count++;
    } else {
      loginAttempts.set(ip, {
        count: 1,
        resetAt: now + 15 * 60 * 1000, // 15 minutes
      });
    }
  }

  next();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || 3000;
  const corsOrigin = (process.env.CORS_ORIGIN || "http://localhost:3001").split(
    ",",
  );

  // Middleware para payloads grandes - DEBE ir ANTES de los pipes
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use(express.json({ limit: "50mb" }));
  expressApp.use(express.urlencoded({ limit: "50mb", extended: true }));

  // �🔒 Apply rate limiter BEFORE validation pipes
  expressApp.use(rateLimitMiddleware);

  // Global Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Middleware
  app.use(cookieParser());
  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  await app.listen(port);
  // Application running on specified port with rate limiting enabled
}

bootstrap();
