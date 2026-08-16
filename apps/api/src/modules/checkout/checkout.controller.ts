import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AuthenticatedRequest } from "../../types/auth.js";
import { createCheckout, confirmCheckout, getMyFinance } from "./checkout.service.js";
import type { CreateCheckoutInput } from "./checkout.validators.js";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await createCheckout(
    (req as AuthenticatedRequest).user.id,
    req.body as CreateCheckoutInput
  );
  res.status(201).json({ data: result });
});

export const confirm = asyncHandler(async (req: Request, res: Response) => {
  const result = await confirmCheckout(
    (req as AuthenticatedRequest).user.id,
    req.params.orderId
  );
  res.json({ data: result });
});

export const myFinance = asyncHandler(async (req: Request, res: Response) => {
  const result = await getMyFinance((req as AuthenticatedRequest).user.id);
  res.json({ data: result });
});
