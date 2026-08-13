import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { ForbiddenError } from "../utils/errors.js";
import { AuthenticatedRequest } from "../types/auth.js";

export async function requirePaidPlan(_req: Request, _res: Response, next: NextFunction) {
  try {
    const user = (_req as AuthenticatedRequest).user;
    if (!user) {
      return next(new ForbiddenError("Autenticação necessária"));
    }

    if (user.role === "ADMIN") {
      return next();
    }

    const plan = await prisma.membershipPlan.findUnique({
      where: { id: user.planId },
      select: { slug: true },
    });

    if (!plan || plan.slug === "gratuito") {
      return next(
        new ForbiddenError(
          "O Meu espaço é exclusivo para assinantes dos planos Pro e Premium. Faça upgrade do seu plano para cadastrar conteúdos."
        )
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}
