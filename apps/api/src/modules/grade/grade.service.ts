import { prisma } from "../../lib/prisma.js";
import { NotFoundError } from "../../utils/errors.js";

export async function listGrade(userId: string) {
  return prisma.gradeSchedule.findMany({
    where: { userId },
    orderBy: [{ period: "asc" }, { day: "asc" }],
  });
}

export async function createGrade(userId: string, data: Record<string, unknown>) {
  return prisma.gradeSchedule.create({
    data: {
      userId,
      name: String(data.name || ""),
      period: Number(data.period || 1),
      day: String(data.day || "Segunda"),
      turma: String(data.turma || ""),
      bloco: String(data.bloco || ""),
      sala: String(data.sala || ""),
      curso: String(data.curso || ""),
      turno: String(data.turno || "Noturno"),
      professor: String(data.professor || ""),
      period1Start: String(data.period1Start || ""),
      period1End: String(data.period1End || ""),
      period2Start: String(data.period2Start || ""),
      period2End: String(data.period2End || ""),
      color: String(data.color || ""),
    },
  });
}

export async function updateGrade(userId: string, id: string, data: Record<string, unknown>) {
  const existing = await prisma.gradeSchedule.findFirst({ where: { id, userId } });
  if (!existing) throw new NotFoundError("Disciplina não encontrada");

  return prisma.gradeSchedule.update({
    where: { id },
    data: {
      name: String(data.name ?? existing.name),
      period: Number(data.period ?? existing.period),
      day: String(data.day ?? existing.day),
      turma: String(data.turma ?? existing.turma),
      bloco: String(data.bloco ?? existing.bloco),
      sala: String(data.sala ?? existing.sala),
      curso: String(data.curso ?? existing.curso),
      turno: String(data.turno ?? existing.turno),
      professor: String(data.professor ?? existing.professor),
      period1Start: String(data.period1Start ?? existing.period1Start),
      period1End: String(data.period1End ?? existing.period1End),
      period2Start: String(data.period2Start ?? existing.period2Start),
      period2End: String(data.period2End ?? existing.period2End),
      color: String(data.color ?? existing.color),
    },
  });
}

export async function deleteGrade(userId: string, id: string) {
  const existing = await prisma.gradeSchedule.findFirst({ where: { id, userId } });
  if (!existing) throw new NotFoundError("Disciplina não encontrada");

  await prisma.gradeSchedule.delete({ where: { id } });
}

export async function deleteAllGrade(userId: string) {
  await prisma.gradeSchedule.deleteMany({ where: { userId } });
}