import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AuthenticatedRequest } from "../../types/auth.js";
import { createCheckout, confirmCheckout, getMyFinance, handleWebhook } from "./checkout.service.js";
import type { CreateCheckoutInput } from "./checkout.validators.js";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await createCheckout(
    (req as AuthenticatedRequest).user.id,
    req.body as CreateCheckoutInput
  );
  res.status(201).json({ data: result });
});

export const confirm = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  const result = await confirmCheckout(user.id, req.params.orderId, user.role === "ADMIN");
  res.json({ data: result });
});

export const webhook = asyncHandler(async (req: Request, res: Response) => {
  const result = await handleWebhook(req);
  res.json(result);
});

export const myFinance = asyncHandler(async (req: Request, res: Response) => {
  const result = await getMyFinance((req as AuthenticatedRequest).user.id);
  res.json({ data: result });
});
