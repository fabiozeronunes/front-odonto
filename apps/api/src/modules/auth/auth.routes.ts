import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import { auditLog } from "../../middlewares/audit.js";
import * as ctrl from "./auth.controller.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  twoFactorVerifySchema,
  twoFactorDisableSchema,
} from "./auth.validators.js";

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Muitas tentativas. Aguarde 15 minutos." } },
});

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Muitas solicitações. Aguarde 1 hora." } },
});

authRouter.post("/register", authLimiter, validate(registerSchema), ctrl.register);
authRouter.post("/login", authLimiter, auditLog("auth.login"), ctrl.login);
authRouter.post("/refresh", validate(refreshSchema), ctrl.refresh);
authRouter.post("/logout", authenticate, ctrl.logout);
authRouter.post("/logout-all", authenticate, auditLog("auth.logout_all"), ctrl.logoutAll);
authRouter.get("/me", authenticate, ctrl.me);
authRouter.patch("/me", authenticate, validate(updateProfileSchema), ctrl.patchMe);
authRouter.post("/change-password", authenticate, validate(changePasswordSchema), auditLog("auth.change_password"), ctrl.updatePassword);
authRouter.post("/forgot-password", forgotLimiter, validate(forgotPasswordSchema), ctrl.forgot);
authRouter.post("/reset-password", authLimiter, validate(resetPasswordSchema), auditLog("auth.reset_password"), ctrl.reset);
authRouter.post("/verify-email", authLimiter, validate(verifyEmailSchema), ctrl.verify);
authRouter.post("/resend-verification", forgotLimiter, validate(resendVerificationSchema), ctrl.resendVerification);
authRouter.post("/2fa/setup", authenticate, ctrl.setup2FA);
authRouter.post("/2fa/verify", authenticate, validate(twoFactorVerifySchema), ctrl.verify2FA);
authRouter.post("/2fa/disable", authenticate, validate(twoFactorDisableSchema), ctrl.disable2FAEndpoint);
authRouter.get("/2fa/status", authenticate, ctrl.get2FA);
