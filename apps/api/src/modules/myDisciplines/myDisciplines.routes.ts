import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import * as ctrl from "./myDisciplines.controller.js";

export const myDisciplinesRouter = Router();

myDisciplinesRouter.use(authenticate);

myDisciplinesRouter.get("/", ctrl.setup);
myDisciplinesRouter.put("/curso", ctrl.saveCurso);
myDisciplinesRouter.post("/", ctrl.create);
myDisciplinesRouter.put("/:id", ctrl.rename);
myDisciplinesRouter.delete("/:id", ctrl.remove);