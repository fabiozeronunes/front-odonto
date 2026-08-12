import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { validate } from "../../middlewares/validate.js";
import { z } from "zod";
import * as ctrl from "./admin.controller.js";

export const adminRouter = Router();

adminRouter.use(authenticate, requireRole(Role.ADMIN));

adminRouter.get("/dashboard", ctrl.dashboard);
adminRouter.get("/users", ctrl.users);
adminRouter.post("/users/:id/activate", ctrl.activate);
adminRouter.post("/users/:id/deactivate", ctrl.deactivate);
adminRouter.put(
  "/users/:id/role",
  validate(z.object({ role: z.enum(["ADMIN", "USER"]) })),
  ctrl.setRole
);
