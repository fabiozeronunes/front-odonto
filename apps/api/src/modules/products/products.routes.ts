import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate } from "../../middlewares/authenticate.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { validate } from "../../middlewares/validate.js";
import * as ctrl from "./products.controller.js";
import {
  createProductCategorySchema,
  createProductSchema,
  productQuerySchema,
  updateProductSchema,
} from "./products.validators.js";

export const productsRouter = Router();

productsRouter.get("/", validate(productQuerySchema, "query"), ctrl.list);
productsRouter.get("/categories", ctrl.categories);
productsRouter.get("/admin", authenticate, requireRole(Role.ADMIN), validate(productQuerySchema, "query"), ctrl.adminList);
productsRouter.get("/:slugOrId", ctrl.getOne);

productsRouter.use(authenticate, requireRole(Role.ADMIN));

productsRouter.post("/", validate(createProductSchema), ctrl.create);
productsRouter.put("/:id", validate(updateProductSchema), ctrl.update);
productsRouter.delete("/:id", ctrl.remove);
productsRouter.post("/categories", validate(createProductCategorySchema), ctrl.createCategory);
productsRouter.put("/categories/:id", validate(createProductCategorySchema.partial()), ctrl.updateCategory);
productsRouter.delete("/categories/:id", ctrl.deleteCategory);