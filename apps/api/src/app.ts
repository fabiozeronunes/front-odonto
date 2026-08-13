import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";
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

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(
    cors({
      origin: env.nodeEnv === "production" ? env.webUrl : true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));

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

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "odontologia-study-api" });
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

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
