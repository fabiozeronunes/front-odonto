import { Router } from "express";
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

authRouter.post("/register", validate(registerSchema), ctrl.register);
authRouter.post("/login", validate(loginSchema), ctrl.login);
authRouter.post("/refresh", validate(refreshSchema), ctrl.refresh);
authRouter.get("/me", authenticate, ctrl.me);
authRouter.patch("/me", authenticate, validate(updateProfileSchema), ctrl.patchMe);
authRouter.post("/change-password", authenticate, validate(changePasswordSchema), ctrl.updatePassword);
authRouter.post("/forgot-password", validate(forgotPasswordSchema), ctrl.forgot);
authRouter.post("/reset-password", validate(resetPasswordSchema), ctrl.reset);
