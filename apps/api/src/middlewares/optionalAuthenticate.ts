import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { AuthenticatedRequest } from "../types/auth.js";

export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return next();
    }

    const token = header.slice(7);
    try {
      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true, planId: true, isActive: true },
      });

      if (user && user.isActive) {
        (req as AuthenticatedRequest).user = user;
      }
    } catch {
      // Invalid token — continue as unauthenticated
    }

    next();
  } catch (err) {
    next(err);
  }
}
