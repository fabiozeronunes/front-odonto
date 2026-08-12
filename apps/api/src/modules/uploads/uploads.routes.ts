import { Router } from "express";
import { authenticate } from "../../middlewares/authenticate.js";
import { upload } from "./uploads.service.js";
import * as ctrl from "./uploads.controller.js";

export const uploadsRouter = Router();

uploadsRouter.use(authenticate);
uploadsRouter.get("/mine", ctrl.myUploads);
uploadsRouter.post("/", upload.single("image"), ctrl.uploadImage);