import crypto from "node:crypto";
import { Request, Response, NextFunction } from "express";

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
