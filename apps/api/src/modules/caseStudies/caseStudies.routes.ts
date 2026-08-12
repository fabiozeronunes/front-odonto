import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import * as ctrl from "./caseStudies.controller.js";
import {
  createCaseStudySchema,
  updateCaseStudySchema,
} from "./caseStudies.validators.js";

export const caseStudiesRouter = Router();

caseStudiesRouter.get("/", ctrl.list);
caseStudiesRouter.get("/me", authenticate, ctrl.myCaseStudies);
caseStudiesRouter.get("/:slugOrId", ctrl.getOne);

caseStudiesRouter.use(authenticate);

caseStudiesRouter.post("/", validate(createCaseStudySchema), ctrl.create);
caseStudiesRouter.put("/:id", validate(updateCaseStudySchema), ctrl.update);
caseStudiesRouter.delete("/:id", ctrl.remove);
caseStudiesRouter.post("/:id/publish", ctrl.publish);
caseStudiesRouter.post("/:id/unpublish", ctrl.unpublish);