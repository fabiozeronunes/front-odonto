import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import * as ctrl from "./checkout.controller.js";
import { createCheckoutSchema } from "./checkout.validators.js";

export const checkoutRouter = Router();

checkoutRouter.use(authenticate);

checkoutRouter.post("/", validate(createCheckoutSchema), ctrl.create);
checkoutRouter.post("/:orderId/confirm", ctrl.confirm);
