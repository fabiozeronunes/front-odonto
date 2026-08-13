import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { requirePaidPlan } from "../../middlewares/requirePaidPlan.js";
import { validate } from "../../middlewares/validate.js";
import * as ctrl from "./tags.controller.js";
import { createTagSchema, updateTagSchema } from "./tags.validators.js";

export const tagsRouter = Router();

tagsRouter.get("/", ctrl.list);
tagsRouter.get("/me", authenticate, ctrl.myTags);
tagsRouter.get("/:slugOrId", ctrl.getOne);

tagsRouter.use(authenticate);

tagsRouter.post("/", requirePaidPlan, validate(createTagSchema), ctrl.create);
tagsRouter.put("/:id", requirePaidPlan, validate(updateTagSchema), ctrl.update);
tagsRouter.delete("/:id", requirePaidPlan, ctrl.remove);