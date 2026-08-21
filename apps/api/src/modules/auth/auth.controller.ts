import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AuthenticatedRequest } from "../../types/auth.js";
import {
  changePassword,
  forgotPassword,
  getProfile,
  loginUser,
  refreshAccess,
  registerUser,
  resetPassword,
  updateProfile,
  verifyEmail,
  resendVerificationEmail,
  logoutUser,
  logoutAllDevices,
} from "./auth.service.js";
import {
  generateTwoFactorSecret,
  verifyAndEnable2FA,
  disable2FA,
  get2FAStatus,
} from "../../services/twoFactor.js";
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from "./auth.validators.js";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await registerUser(req.body as RegisterInput);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const result = await loginUser(req.body as LoginInput, ip);
  res.json(result);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const result = await refreshAccess(req.body.refreshToken);
  res.json(result);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const result = await logoutUser(req.body.refreshToken);
  res.json(result);
});

export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  const result = await logoutAllDevices((req as AuthenticatedRequest).user.id);
  res.json(result);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await getProfile((req as AuthenticatedRequest).user.id);
  res.json({ user });
});

export const patchMe = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateProfileInput;
  const user = await updateProfile((req as AuthenticatedRequest).user.id, body.name);
  res.json({ user });
});

export const updatePassword = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as ChangePasswordInput;
  const result = await changePassword(
    (req as AuthenticatedRequest).user.id,
    body.currentPassword,
    body.newPassword
  );
  res.json(result);
});

export const forgot = asyncHandler(async (req: Request, res: Response) => {
  const result = await forgotPassword(req.body.email);
  res.json(result);
});

export const reset = asyncHandler(async (req: Request, res: Response) => {
  const result = await resetPassword(req.body.token, req.body.newPassword);
  res.json(result);
});

export const verify = asyncHandler(async (req: Request, res: Response) => {
  const result = await verifyEmail(req.body.token);
  res.json(result);
});

export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  const result = await resendVerificationEmail(req.body.email);
  res.json(result);
});

export const setup2FA = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  const result = await generateTwoFactorSecret(user.id, user.email);
  res.json(result);
});

export const verify2FA = asyncHandler(async (req: Request, res: Response) => {
  const result = await verifyAndEnable2FA((req as AuthenticatedRequest).user.id, req.body.token);
  res.json(result);
});

export const disable2FAEndpoint = asyncHandler(async (req: Request, res: Response) => {
  const result = await disable2FA((req as AuthenticatedRequest).user.id, req.body.token);
  res.json(result);
});

export const get2FA = asyncHandler(async (req: Request, res: Response) => {
  const result = await get2FAStatus((req as AuthenticatedRequest).user.id);
  res.json(result);
});
