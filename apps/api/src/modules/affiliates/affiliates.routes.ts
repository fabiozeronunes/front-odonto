import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { validate } from "../../middlewares/validate.js";
import { z } from "zod";
import * as ctrl from "./affiliates.controller.js";

export const affiliatesRouter = Router();

affiliatesRouter.get("/me", authenticate, ctrl.me);

affiliatesRouter.use(authenticate, requireRole(Role.ADMIN));

affiliatesRouter.get("/", ctrl.list);
affiliatesRouter.get("/:id", ctrl.detail);
affiliatesRouter.put(
  "/:id/enable",
  validate(z.object({ commissionRate: z.coerce.number().min(0).max(100).optional() })),
  ctrl.enable
);
affiliatesRouter.put("/:id/disable", ctrl.disable);
affiliatesRouter.put(
  "/:id/rate",
  validate(
    z.object({
      commissionRate: z.coerce.number().min(0).max(100),
      productCommissionRate: z.coerce.number().min(0).max(100).optional(),
    })
  ),
  ctrl.setRate
);
affiliatesRouter.post(
  "/:id/payments",
  validate(
    z.object({
      referredUserId: z.string().min(1),
      amount: z.coerce.number().min(0).optional(),
    })
  ),
  ctrl.registerPayment
);
affiliatesRouter.post("/commissions/:commissionId/pay", ctrl.pay);
affiliatesRouter.post("/commissions/:commissionId/cancel", ctrl.cancel);