import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import * as ctrl from "./videos.controller.js";
import {
  createVideoSchema,
  updateVideoSchema,
  videoQuerySchema,
} from "./videos.validators.js";

export const videosRouter = Router();

videosRouter.get("/", validate(videoQuerySchema, "query"), ctrl.list);
videosRouter.get("/me/favorites", authenticate, ctrl.favorites);
videosRouter.get("/me/history", authenticate, ctrl.history);
videosRouter.get("/me", authenticate, ctrl.myVideos);
videosRouter.get("/image-tags", ctrl.imageTags);
videosRouter.get("/images", ctrl.searchImages);
videosRouter.get("/:slugOrId/related", authenticate, ctrl.related);
videosRouter.get("/:slugOrId", ctrl.getOne);

videosRouter.use(authenticate);

videosRouter.post("/:id/watch", ctrl.watch);
videosRouter.post("/:id/favorite", ctrl.favorite);
videosRouter.post("/", validate(createVideoSchema), ctrl.create);
videosRouter.put("/:id", validate(updateVideoSchema), ctrl.update);
videosRouter.delete("/:id", ctrl.remove);
videosRouter.post("/:id/publish", ctrl.publish);
videosRouter.post("/:id/unpublish", ctrl.unpublish);