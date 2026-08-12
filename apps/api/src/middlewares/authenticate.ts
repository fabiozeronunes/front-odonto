import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { UnauthorizedError } from "../utils/errors.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { AuthenticatedRequest } from "../types/auth.js";

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Token de acesso ausente");
    }

    const token = header.slice(7);
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new UnauthorizedError("Token inválido ou expirado");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, planId: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError("Usuário inativo ou inexistente");
    }

    (req as AuthenticatedRequest).user = user;
    next();
  } catch (err) {
    next(err);
  }
}
