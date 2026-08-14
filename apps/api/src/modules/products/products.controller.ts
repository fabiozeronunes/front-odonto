import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { AuthenticatedRequest } from "../../types/auth.js";
import * as service from "./products.service.js";
import type { ProductQueryInput } from "./products.validators.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listProducts(req.query as ProductQueryInput);
  res.json(result);
});

export const adminList = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listProducts(req.query as ProductQueryInput, { admin: true });
  res.json(result);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const product = await service.getProduct(req.params.slugOrId);
  res.json(product);
});

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await service.createOrder((req as AuthenticatedRequest).user.id, req.body);
  res.status(201).json({ data: order });
});

export const confirmOrder = asyncHandler(async (req: Request, res: Response) => {
  res.json(await service.confirmOrder((req as AuthenticatedRequest).user.id, req.params.id));
});

export const myOrders = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await service.listMyOrders((req as AuthenticatedRequest).user.id) });
});

export const allOrders = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ data: await service.listOrders() });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const product = await service.createProduct(req.body);
  res.status(201).json({ data: product });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const product = await service.updateProduct(req.params.id, req.body);
  res.json({ data: product });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  res.json(await service.deleteProduct(req.params.id));
});

export const categories = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ data: await service.listCategories() });
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await service.createCategory(req.body);
  res.status(201).json({ data: category });
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await service.updateCategory(req.params.id, req.body);
  res.json({ data: category });
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  res.json(await service.deleteCategory(req.params.id));
});