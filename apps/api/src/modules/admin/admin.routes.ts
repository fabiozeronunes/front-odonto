import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { validate } from "../../middlewares/validate.js";
import { auditLog } from "../../middlewares/audit.js";
import { z } from "zod";
import * as ctrl from "./admin.controller.js";
import { logoPost } from "../settings/settings.controller.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getAuditLogs } from "../../services/audit.js";
import { AuthenticatedRequest } from "../../types/auth.js";
import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { blacklistIP, removeIPFromBlacklist, getBlacklistedIPs } from "../../services/blacklist.js";

export const adminRouter = Router();

adminRouter.use(authenticate, requireRole(Role.ADMIN));

adminRouter.get("/dashboard", ctrl.dashboard);
adminRouter.get("/users", ctrl.users);
adminRouter.get("/users/summary", ctrl.billingSummary);
adminRouter.post("/users/:id/activate", auditLog("user.activate", "user"), ctrl.activate);
adminRouter.post("/users/:id/deactivate", auditLog("user.deactivate", "user"), ctrl.deactivate);
adminRouter.post("/users/:id/whatsapp", auditLog("user.whatsapp_notify", "user"), ctrl.notifyWhatsApp);
adminRouter.post("/users/:id/confirm-payment", auditLog("user.confirm_payment", "user"), ctrl.confirmPayment);

adminRouter.get("/study", ctrl.listStudy);
adminRouter.post("/study/:id/approve", auditLog("study.approve", "studyResource"), ctrl.approveStudy);
adminRouter.post("/study/:id/reject", auditLog("study.reject", "studyResource"), ctrl.rejectStudy);
adminRouter.put(
  "/users/:id/role",
  validate(z.object({ role: z.enum(["ADMIN", "USER"]) })),
  auditLog("user.set_role", "user"),
  ctrl.setRole
);
adminRouter.put(
  "/users/:id/plan",
  validate(z.object({ planId: z.string().min(1) })),
  auditLog("user.set_plan", "user"),
  ctrl.setPlan
);
adminRouter.put(
  "/users/:id/contact",
  validate(z.object({ phone: z.string().max(30).optional().nullable() })),
  auditLog("user.update_contact", "user"),
  ctrl.updateContact
);
adminRouter.delete("/users/:id", auditLog("user.delete", "user"), ctrl.remove);

adminRouter.post(
  "/settings/logo",
  validate(z.object({ url: z.string().min(1).max(500) })),
  auditLog("settings.update_logo", "settings"),
  logoPost
);

adminRouter.get("/audit-logs", asyncHandler(async (req: Request, res: Response) => {
  const { userId, action, resource, limit, offset } = req.query;
  const result = await getAuditLogs({
    userId: userId as string,
    action: action as string,
    resource: resource as string,
    limit: limit ? parseInt(limit as string) : 50,
    offset: offset ? parseInt(offset as string) : 0,
  });
  res.json(result);
}));

adminRouter.post("/users/:id/verify-email", asyncHandler(async (req: Request, res: Response) => {
  await prisma.user.update({ where: { id: req.params.id }, data: { emailVerified: true } });
  res.json({ ok: true });
}));

adminRouter.get("/blacklist", asyncHandler(async (_req: Request, res: Response) => {
  const ips = await getBlacklistedIPs();
  res.json({ ips });
}));

adminRouter.post(
  "/blacklist",
  validate(z.object({
    ip: z.string().ip("IP inválido"),
    reason: z.string().max(200).optional(),
    expiresAt: z.string().datetime().optional(),
  })),
  auditLog("ip.blacklist", "ip"),
  asyncHandler(async (req: Request, res: Response) => {
    const { ip, reason, expiresAt } = req.body;
    await blacklistIP(ip, reason, expiresAt ? new Date(expiresAt) : undefined);
    res.json({ ok: true });
  })
);

adminRouter.delete(
  "/blacklist/:ip",
  auditLog("ip.unblock", "ip"),
  asyncHandler(async (req: Request, res: Response) => {
    await removeIPFromBlacklist(req.params.ip);
    res.json({ ok: true });
  })
);
