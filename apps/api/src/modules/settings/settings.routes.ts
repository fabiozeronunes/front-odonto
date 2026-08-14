import { Router } from "express";
import * as ctrl from "./settings.controller.js";

export const settingsRouter = Router();

settingsRouter.get("/logo", ctrl.logoGet);