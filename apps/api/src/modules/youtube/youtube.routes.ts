import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import { z } from "zod";
import * as ctrl from "./youtube.controller.js";

export const youtubeRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith("video/")) cb(null, true);
    else cb(new Error("Apenas arquivos de vídeo são permitidos"));
  },
});

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
youtubeRouter.post(
  "/upload",
  upload.single("video"),
  ctrl.uploadVideo
);