import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { validate } from "../../middlewares/validate.js";
import * as ctrl from "./checkout.controller.js";
import { createCheckoutSchema } from "./checkout.validators.js";

export const checkoutRouter = Router();

// Webhook endpoint — NO auth (validated by gateway signature)
checkoutRouter.post("/webhook", ctrl.webhook);

// All routes below require authentication
checkoutRouter.use(authenticate);

checkoutRouter.post("/", validate(createCheckoutSchema), ctrl.create);
checkoutRouter.get("/me", ctrl.myFinance);

// Confirm is admin-only — clients should NOT confirm their own payments
checkoutRouter.post(
  "/:orderId/confirm",
  requireRole(Role.ADMIN),
  ctrl.confirm
);
