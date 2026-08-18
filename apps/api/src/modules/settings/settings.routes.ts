import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/requireRole.js";
import * as ctrl from "./settings.controller.js";

export const settingsRouter = Router();

settingsRouter.get("/logo", ctrl.logoGet);
settingsRouter.get("/hero-video", ctrl.heroVideoGet);
settingsRouter.post("/hero-video", authenticate, requireRole(Role.ADMIN), ctrl.heroVideoPost);
settingsRouter.delete("/hero-video", authenticate, requireRole(Role.ADMIN), ctrl.heroVideoDelete);
settingsRouter.get("/home-lock", ctrl.homeLockGet);
settingsRouter.post("/home-lock", authenticate, requireRole(Role.ADMIN), ctrl.homeLockPost);
settingsRouter.get("/payment", ctrl.paymentGet);
settingsRouter.post("/payment", authenticate, requireRole(Role.ADMIN), ctrl.paymentPost);