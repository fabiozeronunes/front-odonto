import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import * as ctrl from "./study.controller.js";
import {
  saveResourceSchema,
  generateResourceSchema,
  saveGeminiKeySchema,
  voteSchema,
  transcribeSchema,
} from "./study.validators.js";

const studyRouter = Router();

studyRouter.use(authenticate);

studyRouter.post("/save", validate(saveResourceSchema), ctrl.save);
studyRouter.post("/generate", validate(generateResourceSchema), ctrl.generate);
studyRouter.post("/generate-all", validate(generateResourceSchema), ctrl.generateAll);
studyRouter.post("/transcribe", validate(transcribeSchema), ctrl.transcribe);
studyRouter.get("/me", ctrl.mine);
studyRouter.get("/video/:videoId", ctrl.byVideo);
studyRouter.get("/case/:caseStudyId", ctrl.byCase);
studyRouter.post("/gemini-key", validate(saveGeminiKeySchema), ctrl.saveKey);
studyRouter.get("/gemini-key", ctrl.myKey);
studyRouter.get("/:id", ctrl.one);
studyRouter.post("/:id/submit", ctrl.submit);
studyRouter.delete("/:id", ctrl.remove);
studyRouter.post("/:id/vote", validate(voteSchema), ctrl.vote);

export { studyRouter };
