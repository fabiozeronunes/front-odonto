import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import * as ctrl from "./grade.controller.js";

export const gradeRouter = Router();

gradeRouter.use(authenticate);

gradeRouter.get("/", ctrl.list);
gradeRouter.post("/", ctrl.create);
gradeRouter.put("/:id", ctrl.update);
gradeRouter.delete("/:id", ctrl.remove);
gradeRouter.delete("/", ctrl.removeAll);