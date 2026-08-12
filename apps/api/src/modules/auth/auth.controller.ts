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
} from "./auth.service.js";
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
  const result = await loginUser(req.body as LoginInput);
  res.json(result);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const result = await refreshAccess(req.body.refreshToken);
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
