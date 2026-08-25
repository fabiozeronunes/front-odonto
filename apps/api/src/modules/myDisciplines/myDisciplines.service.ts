import { prisma } from "../../lib/prisma.js";
import { NotFoundError } from "../../utils/errors.js";

export async function getSetup(userId: string) {
  const [disciplinas, user] = await Promise.all([
    prisma.courseDiscipline.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    prisma.user.findUnique({ where: { id: userId }, select: { curso: true } }),
  ]);
  return { curso: user?.curso ?? "", disciplinas };
}

export async function saveCurso(userId: string, curso: string) {
  await prisma.user.update({ where: { id: userId }, data: { curso: curso.trim() || null } });
  return { ok: true, curso: curso.trim() };
}

export async function createDiscipline(userId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new NotFoundError("Nome da disciplina obrigatório");
  const existing = await prisma.courseDiscipline.findFirst({
    where: { userId, name: { equals: trimmed } },
  });
  if (existing) return existing;
  return prisma.courseDiscipline.create({ data: { userId, name: trimmed } });
}

export async function renameDiscipline(userId: string, id: string, name: string) {
  const existing = await prisma.courseDiscipline.findFirst({ where: { id, userId } });
  if (!existing) throw new NotFoundError("Disciplina não encontrada");
  const trimmed = name.trim();
  if (!trimmed) throw new NotFoundError("Nome da disciplina obrigatório");
  return prisma.courseDiscipline.update({ where: { id }, data: { name: trimmed } });
}

export async function deleteDiscipline(userId: string, id: string) {
  const existing = await prisma.courseDiscipline.findFirst({ where: { id, userId } });
  if (!existing) throw new NotFoundError("Disciplina não encontrada");
  await prisma.courseDiscipline.delete({ where: { id } });
}