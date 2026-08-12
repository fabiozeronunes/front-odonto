import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import { z } from "zod";
import * as ctrl from "./youtube.controller.js";

export const youtubeRouter = Router();

youtubeRouter.use(authenticate);

youtubeRouter.get(
  "/info",
  validate(z.object({ url: z.string().url("URL inválida") }), "query"),
  ctrl.info
);
youtubeRouter.post(
  "/import",
  validate(z.object({ url: z.string().url("URL inválida") })),
  ctrl.importFromUrl
);