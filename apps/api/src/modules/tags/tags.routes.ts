import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import * as ctrl from "./tags.controller.js";
import { createTagSchema, updateTagSchema } from "./tags.validators.js";

export const tagsRouter = Router();

tagsRouter.get("/", ctrl.list);
tagsRouter.get("/me", authenticate, ctrl.myTags);
tagsRouter.get("/:slugOrId", ctrl.getOne);

tagsRouter.use(authenticate);

tagsRouter.post("/", validate(createTagSchema), ctrl.create);
tagsRouter.put("/:id", validate(updateTagSchema), ctrl.update);
tagsRouter.delete("/:id", ctrl.remove);