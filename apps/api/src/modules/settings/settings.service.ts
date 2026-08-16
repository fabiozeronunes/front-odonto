import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "@prisma/client";

export async function getSiteSetting(key: string) {
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function upsertSiteSetting(key: string, value: string) {
  const row = await prisma.siteSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  return row.value;
}

export async function getPaymentSettings() {
  const row = await prisma.siteSetting.findUnique({ where: { key: "payment" } });
  return (row?.value as Record<string, unknown> | null) ?? null;
}

export async function upsertPaymentSettings(data: Record<string, unknown>) {
  const row = await prisma.siteSetting.upsert({
    where: { key: "payment" },
    update: { value: data as Prisma.InputJsonValue },
    create: { key: "payment", value: data as Prisma.InputJsonValue },
  });
  return row.value;
}