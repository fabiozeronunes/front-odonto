import { prisma } from "../../lib/prisma.js";
import { NotFoundError } from "../../utils/errors.js";

interface DisciplineFields {
  name: string;
  curso?: string | null;
  diaSemana?: string | null;
  periodo?: string | null;
  turno?: string | null;
  professor?: string | null;
  turma?: string | null;
  bloco?: string | null;
  sala?: string | null;
}

function pickFields(body: Record<string, unknown>): DisciplineFields {
  return {
    name: String(body.name ?? "").trim(),
    curso: String(body.curso ?? "").trim() || null,
    diaSemana: String(body.diaSemana ?? "").trim() || null,
    periodo: String(body.periodo ?? "").trim() || null,
    turno: String(body.turno ?? "").trim() || null,
    professor: String(body.professor ?? "").trim() || null,
    turma: String(body.turma ?? "").trim() || null,
    bloco: String(body.bloco ?? "").trim() || null,
    sala: String(body.sala ?? "").trim() || null,
  };
}

export async function getSetup(userId: string) {
  const [disciplinas, user] = await Promise.all([
    prisma.courseDiscipline.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    prisma.user.findUnique({ where: { id: userId }, select: { curso: true } }),
  ]);
  return { curso: user?.curso ?? "", disciplinas };
}

export async function createDiscipline(userId: string, body: Record<string, unknown>) {
  const fields = pickFields(body);
  if (!fields.name) throw new NotFoundError("Nome da disciplina obrigatório");
  const existing = await prisma.courseDiscipline.findFirst({
    where: { userId, name: { equals: fields.name } },
  });
  if (existing) return existing;
  return prisma.courseDiscipline.create({ data: { userId, ...fields } });
}

export async function updateDiscipline(userId: string, id: string, body: Record<string, unknown>) {
  const existing = await prisma.courseDiscipline.findFirst({ where: { id, userId } });
  if (!existing) throw new NotFoundError("Disciplina não encontrada");
  const fields = pickFields(body);
  if (!fields.name) throw new NotFoundError("Nome da disciplina obrigatório");
  return prisma.courseDiscipline.update({ where: { id }, data: { ...fields } });
}

export async function deleteDiscipline(userId: string, id: string) {
  const existing = await prisma.courseDiscipline.findFirst({ where: { id, userId } });
  if (!existing) throw new NotFoundError("Disciplina não encontrada");
  await prisma.courseDiscipline.delete({ where: { id } });
}