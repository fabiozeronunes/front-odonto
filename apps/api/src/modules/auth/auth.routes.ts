import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import * as ctrl from "./auth.controller.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "./auth.validators.js";

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Muitas tentativas. Aguarde 15 minutos." } },
});

const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Muitas solicitações. Aguarde 1 hora." } },
});

authRouter.post("/register", authLimiter, validate(registerSchema), ctrl.register);
authRouter.post("/login", authLimiter, validate(loginSchema), ctrl.login);
authRouter.post("/refresh", validate(refreshSchema), ctrl.refresh);
authRouter.get("/me", authenticate, ctrl.me);
authRouter.patch("/me", authenticate, validate(updateProfileSchema), ctrl.patchMe);
authRouter.post("/change-password", authenticate, validate(changePasswordSchema), ctrl.updatePassword);
authRouter.post("/forgot-password", forgotLimiter, validate(forgotPasswordSchema), ctrl.forgot);
authRouter.post("/reset-password", authLimiter, validate(resetPasswordSchema), ctrl.reset);
