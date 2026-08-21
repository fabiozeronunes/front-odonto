import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/errors.js";

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new ApiError(404, `Rota não encontrada: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: { message: err.message },
    });
  }

  const prismaErr = err as { code?: string; meta?: { target?: string[] } };
  if (prismaErr?.code === "P2002") {
    return res.status(409).json({
      error: { message: "Registro duplicado" },
    });
  }

  console.error("Erro não tratado:", err);
  return res.status(500).json({
    error: { message: "Erro interno do servidor" },
  });
}
