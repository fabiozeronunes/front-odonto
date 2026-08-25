import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";
import { requestId, requestTimeout } from "./middlewares/request.js";
import { sanitizeInput } from "./middlewares/sanitize.js";
import { fingerprintDetector } from "./middlewares/fingerprint.js";
import { checkBlacklist } from "./services/blacklist.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { specialtiesRouter } from "./modules/specialties/specialties.routes.js";
import { tagsRouter } from "./modules/tags/tags.routes.js";
import { videosRouter } from "./modules/videos/videos.routes.js";
import { caseStudiesRouter } from "./modules/caseStudies/caseStudies.routes.js";
import { plansRouter } from "./modules/plans/plans.routes.js";
import { adminRouter } from "./modules/admin/admin.routes.js";
import { affiliatesRouter } from "./modules/affiliates/affiliates.routes.js";
import { checkoutRouter } from "./modules/checkout/checkout.routes.js";
import { uploadsRouter } from "./modules/uploads/uploads.routes.js";
import { youtubeRouter } from "./modules/youtube/youtube.routes.js";
import { settingsRouter } from "./modules/settings/settings.routes.js";
import { productsRouter } from "./modules/products/products.routes.js";
import { studyRouter } from "./modules/study/study.routes.js";
import { gradeRouter } from "./modules/grade/grade.routes.js";
import { startCleanupSchedule } from "./modules/youtube/youtube.service.js";
import { prisma } from "./lib/prisma.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  if (env.nodeEnv === "production") {
    app.use((req, res, next) => {
      if (req.headers["x-forwarded-proto"] !== "https") {
        return res.redirect(301, `https://${req.headers.host}${req.url}`);
      }
      next();
    });
  }

  app.use(requestId);
  app.use(requestTimeout(30000));
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  }));

  const allowedOrigins = env.corsOrigins
    ? env.corsOrigins.split(",").map((s) => s.trim())
    : [env.webUrl];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(sanitizeInput);
  app.use(fingerprintDetector);
  app.use(checkBlacklist);

  app.use(
    rateLimit({
      windowMs: env.rateLimitWindowMs,
      max: env.rateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_req, res) => {
        res.status(429).json({
          error: { message: "Muitas requisições. Aguarde alguns segundos e tente novamente." },
        });
      },
    })
  );

  app.get("/health", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: "ok", service: "odontologia-study-api", db: "connected" });
    } catch {
      res.status(503).json({ status: "error", service: "odontologia-study-api", db: "disconnected" });
    }
  });

  app.post("/admin/migrate", async (_req, res) => {
    const { applyMigrations } = await import("./services/migrate.js");
    await applyMigrations();
    res.json({ status: "ok", message: "Migrations applied" });
  });

  app.get("/", (_req, res) => {
    res.json({
      name: "FrontOdontus API",
      docs: "Acesse a aplicação web em " + env.webUrl,
      health: "/health",
      api: "/api",
    });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/specialties", specialtiesRouter);
  app.use("/api/tags", tagsRouter);
  app.use("/api/videos", videosRouter);
  app.use("/api/case-studies", caseStudiesRouter);
  app.use("/api/plans", plansRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/affiliates", affiliatesRouter);
  app.use("/api/checkout", checkoutRouter);
  app.use("/api/uploads", uploadsRouter);
  app.use("/api/youtube", youtubeRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/study", studyRouter);
  app.use("/api/grade", gradeRouter);

  app.use(notFound);
  app.use(errorHandler);

  startCleanupSchedule();

  return app;
}
