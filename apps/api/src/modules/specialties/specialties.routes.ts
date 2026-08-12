import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import * as ctrl from "./specialties.controller.js";
import { createSpecialtySchema, updateSpecialtySchema } from "./specialties.validators.js";

export const specialtiesRouter = Router();

specialtiesRouter.get("/", ctrl.list);
specialtiesRouter.get("/me", authenticate, ctrl.mySpecialties);
specialtiesRouter.get("/:slugOrId", ctrl.getOne);

specialtiesRouter.use(authenticate);

specialtiesRouter.post("/", validate(createSpecialtySchema), ctrl.create);
specialtiesRouter.put("/:id", validate(updateSpecialtySchema), ctrl.update);
specialtiesRouter.delete("/:id", ctrl.remove);