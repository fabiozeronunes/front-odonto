import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { optionalAuthenticate } from "../../middlewares/optionalAuthenticate.js";
import { requirePaidPlan } from "../../middlewares/requirePaidPlan.js";
import { validate } from "../../middlewares/validate.js";
import * as ctrl from "./caseStudies.controller.js";
import {
  createCaseStudySchema,
  updateCaseStudySchema,
} from "./caseStudies.validators.js";

export const caseStudiesRouter = Router();

caseStudiesRouter.get("/", optionalAuthenticate, ctrl.list);
caseStudiesRouter.get("/me", authenticate, ctrl.myCaseStudies);
caseStudiesRouter.get("/:slugOrId", optionalAuthenticate, ctrl.getOne);

caseStudiesRouter.use(authenticate);

caseStudiesRouter.post("/", requirePaidPlan, validate(createCaseStudySchema), ctrl.create);
caseStudiesRouter.put("/:id", requirePaidPlan, validate(updateCaseStudySchema), ctrl.update);
caseStudiesRouter.delete("/:id", requirePaidPlan, ctrl.remove);
caseStudiesRouter.post("/:id/publish", requirePaidPlan, ctrl.publish);
caseStudiesRouter.post("/:id/unpublish", requirePaidPlan, ctrl.unpublish);