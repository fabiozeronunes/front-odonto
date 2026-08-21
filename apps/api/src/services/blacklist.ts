import { prisma } from "../lib/prisma.js";
import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../utils/errors.js";

let blacklistedIPs: Set<string> = new Set();
let lastLoad = 0;
const LOAD_INTERVAL = 60 * 1000;

async function loadBlacklist() {
  try {
    const now = Date.now();
    if (now - lastLoad < LOAD_INTERVAL) return;

    const records = await prisma.$queryRaw`
      SELECT ip FROM "IPBlacklist" WHERE "expiresAt" IS NULL OR "expiresAt" > NOW()
    ` as { ip: string }[];

    blacklistedIPs = new Set(records.map((r) => r.ip));
    lastLoad = now;
  } catch {
    // Table may not exist yet
  }
}

export async function checkBlacklist(req: Request, _res: Response, next: NextFunction) {
  await loadBlacklist();
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  if (blacklistedIPs.has(ip)) {
    throw new ForbiddenError("Acesso bloqueado");
  }
  next();
}

export async function blacklistIP(ip: string, reason?: string, expiresAt?: Date) {
  await prisma.$executeRaw`
    INSERT INTO "IPBlacklist" ("id", "ip", "reason", "expiresAt", "createdAt")
    VALUES (${crypto.randomUUID()}, ${ip}, ${reason || null}, ${expiresAt || null}, NOW())
    ON CONFLICT ("ip") DO NOTHING
  `;
  blacklistedIPs.add(ip);
}

export async function removeIPFromBlacklist(ip: string) {
  await prisma.$executeRaw`DELETE FROM "IPBlacklist" WHERE "ip" = ${ip}`;
  blacklistedIPs.delete(ip);
}

export async function getBlacklistedIPs() {
  await loadBlacklist();
  return Array.from(blacklistedIPs);
}
