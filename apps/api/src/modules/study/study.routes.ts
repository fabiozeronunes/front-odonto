import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import * as ctrl from "./study.controller.js";
import {
  saveResourceSchema,
  generateResourceSchema,
  saveGeminiKeySchema,
  voteSchema,
} from "./study.validators.js";

const studyRouter = Router();

studyRouter.use(authenticate);

studyRouter.post("/save", validate(saveResourceSchema), ctrl.save);
studyRouter.post("/generate", validate(generateResourceSchema), ctrl.generate);
studyRouter.get("/me", ctrl.mine);
studyRouter.get("/video/:videoId", ctrl.byVideo);
studyRouter.get("/:id", ctrl.one);
studyRouter.post("/:id/submit", ctrl.submit);
studyRouter.delete("/:id", ctrl.remove);
studyRouter.post("/:id/vote", validate(voteSchema), ctrl.vote);
studyRouter.post("/gemini-key", validate(saveGeminiKeySchema), ctrl.saveKey);
studyRouter.get("/gemini-key", ctrl.myKey);

export { studyRouter };