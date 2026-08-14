import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { validate } from "../../middlewares/validate.js";
import * as ctrl from "./products.controller.js";
import {
  createOrderSchema,
  createProductCategorySchema,
  createProductSchema,
  productQuerySchema,
  updateProductSchema,
} from "./products.validators.js";

export const productsRouter = Router();

productsRouter.get("/", validate(productQuerySchema, "query"), ctrl.list);
productsRouter.get("/categories", ctrl.categories);
productsRouter.get("/admin", authenticate, requireRole(Role.ADMIN), validate(productQuerySchema, "query"), ctrl.adminList);
productsRouter.post("/orders", authenticate, validate(createOrderSchema), ctrl.createOrder);
productsRouter.post("/orders/:id/confirm", authenticate, ctrl.confirmOrder);
productsRouter.get("/orders/me", authenticate, ctrl.myOrders);
productsRouter.get("/orders", authenticate, requireRole(Role.ADMIN), ctrl.allOrders);
productsRouter.get("/:slugOrId", ctrl.getOne);

productsRouter.use(authenticate, requireRole(Role.ADMIN));

productsRouter.post("/", validate(createProductSchema), ctrl.create);
productsRouter.put("/:id", validate(updateProductSchema), ctrl.update);
productsRouter.delete("/:id", ctrl.remove);
productsRouter.post("/categories", validate(createProductCategorySchema), ctrl.createCategory);
productsRouter.put("/categories/:id", validate(createProductCategorySchema.partial()), ctrl.updateCategory);
productsRouter.delete("/categories/:id", ctrl.deleteCategory);