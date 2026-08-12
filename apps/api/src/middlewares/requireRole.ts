import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { ForbiddenError } from "../utils/errors.js";
import { AuthenticatedRequest } from "../types/auth.js";

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      return next(new ForbiddenError("Autenticação necessária"));
    }
    if (!roles.includes(user.role)) {
      return next(new ForbiddenError("Permissão insuficiente"));
    }
    next();
  };
}
