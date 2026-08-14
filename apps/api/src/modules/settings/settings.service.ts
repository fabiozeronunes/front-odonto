import { prisma } from "../../lib/prisma.js";

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