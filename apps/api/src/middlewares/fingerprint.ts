import crypto from "node:crypto";
import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../utils/errors.js";
import { AuthenticatedRequest } from "../types/auth.js";

function generateFingerprint(req: Request): string {
  const ua = req.headers["user-agent"] || "unknown";
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  return crypto.createHash("sha256").update(`${ua}:${ip}`).digest("hex");
}

declare global {
  namespace Express {
    interface Request {
      fingerprint?: string;
    }
  }
}

export function fingerprintDetector(req: Request, _res: Response, next: NextFunction) {
  req.fingerprint = generateFingerprint(req);
  next();
}

export function requireMatchingFingerprint(req: Request) {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user?.fingerprint) return;

  const currentFingerprint = generateFingerprint(req);
  if (authReq.user.fingerprint !== currentFingerprint) {
    throw new UnauthorizedError("Sessão inválida. Faça login novamente.");
  }
}
