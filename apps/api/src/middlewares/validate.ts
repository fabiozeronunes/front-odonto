import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";
import { ApiError } from "../utils/errors.js";

type Source = "body" | "query" | "params";

export function validate<T>(schema: ZodSchema<T>, source: Source = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(
        new ApiError(400, "Dados inválidos", result.error.flatten().fieldErrors)
      );
    }
    (req as Request & Record<string, unknown>)[`${source}`] = result.data;
    next();
  };
}
