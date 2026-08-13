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
adminRouter.get("/users/summary", ctrl.billingSummary);
adminRouter.post("/users/:id/activate", ctrl.activate);
adminRouter.post("/users/:id/deactivate", ctrl.deactivate);
adminRouter.post("/users/:id/whatsapp", ctrl.notifyWhatsApp);
adminRouter.put(
  "/users/:id/role",
  validate(z.object({ role: z.enum(["ADMIN", "USER"]) })),
  ctrl.setRole
);
adminRouter.put(
  "/users/:id/plan",
  validate(z.object({ planId: z.string().min(1) })),
  ctrl.setPlan
);
adminRouter.put(
  "/users/:id/contact",
  validate(z.object({ phone: z.string().max(30).optional().nullable() })),
  ctrl.updateContact
);
