import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { validate } from "../../middlewares/validate.js";
import * as ctrl from "./plans.controller.js";
import { createPlanSchema, updatePlanSchema } from "./plans.validators.js";

export const plansRouter = Router();

plansRouter.get("/", ctrl.list);

plansRouter.use(authenticate, requireRole(Role.ADMIN));

plansRouter.post("/", validate(createPlanSchema), ctrl.create);
plansRouter.put("/:id", validate(updatePlanSchema), ctrl.update);
plansRouter.delete("/:id", ctrl.remove);
