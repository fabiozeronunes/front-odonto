import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { optionalAuthenticate } from "../../middlewares/optionalAuthenticate.js";
import { requirePaidPlan } from "../../middlewares/requirePaidPlan.js";
import { validate } from "../../middlewares/validate.js";
import * as ctrl from "./videos.controller.js";
import {
  createVideoSchema,
  updateVideoSchema,
  videoQuerySchema,
} from "./videos.validators.js";

export const videosRouter = Router();

videosRouter.get("/", optionalAuthenticate, validate(videoQuerySchema, "query"), ctrl.list);
videosRouter.get("/me/favorites", authenticate, ctrl.favorites);
videosRouter.get("/me/history", authenticate, ctrl.history);
videosRouter.get("/me", authenticate, ctrl.myVideos);
videosRouter.get("/image-tags", ctrl.imageTags);
videosRouter.get("/images", ctrl.searchImages);
videosRouter.get("/:slugOrId/related", authenticate, ctrl.related);
videosRouter.get("/:slugOrId", optionalAuthenticate, ctrl.getOne);

videosRouter.use(authenticate);

videosRouter.post("/:id/watch", ctrl.watch);
videosRouter.post("/:id/favorite", ctrl.favorite);
videosRouter.post("/", requirePaidPlan, validate(createVideoSchema), ctrl.create);
videosRouter.put("/:id", requirePaidPlan, validate(updateVideoSchema), ctrl.update);
videosRouter.delete("/:id", requirePaidPlan, ctrl.remove);
videosRouter.post("/:id/publish", requirePaidPlan, ctrl.publish);
videosRouter.post("/:id/unpublish", requirePaidPlan, ctrl.unpublish);