import { prisma } from "../../lib/prisma.js";
import { ForbiddenError, NotFoundError } from "../../utils/errors.js";
import { slugify } from "../../utils/slugify.js";
import type { AuthUser } from "../../types/auth.js";
import type { CreateSpecialtyInput, UpdateSpecialtyInput } from "./specialties.validators.js";

export async function listSpecialties(params: { includeInactive?: boolean }) {
  return prisma.specialty.findMany({
    where: params.includeInactive ? undefined : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      sortOrder: true,
      isActive: true,
      createdAt: true,
      createdById: true,
      _count: { select: { videos: { where: { status: "PUBLISHED" } } } },
    },
  });
}

export async function listMySpecialties(userId: string) {
  return prisma.specialty.findMany({
    where: { createdById: userId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      sortOrder: true,
      isActive: true,
      createdAt: true,
      _count: { select: { videos: { where: { status: "PUBLISHED" } } } },
    },
  });
}

export async function getSpecialty(slugOrId: string) {
  const specialty = await prisma.specialty.findFirst({
    where: { OR: [{ id: slugOrId }, { slug: slugOrId }] },
    include: {
      videos: {
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 12,
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnailUrl: true,
          durationSeconds: true,
          isFree: true,
          difficulty: true,
          publishedAt: true,
        },
      },
    },
  });
  if (!specialty) throw new NotFoundError("Especialidade não encontrada");
  return specialty;
}

export async function createSpecialty(input: CreateSpecialtyInput, createdById?: string) {
  return prisma.specialty.create({
    data: {
      name: input.name,
      slug: slugify(input.name),
      description: input.description,
      sortOrder: input.sortOrder ?? 0,
      createdBy: createdById ? { connect: { id: createdById } } : undefined,
    },
  });
}

export async function assertCanManageSpecialty(id: string, user: AuthUser) {
  const specialty = await prisma.specialty.findUnique({ where: { id } });
  if (!specialty) throw new NotFoundError("Especialidade não encontrada");
  if (user.role !== "ADMIN" && specialty.createdById !== user.id) {
    throw new ForbiddenError("Você só pode gerenciar as próprias especialidades");
  }
  return specialty;
}

export async function updateSpecialty(id: string, input: UpdateSpecialtyInput, user: AuthUser) {
  await assertCanManageSpecialty(id, user);
  return prisma.specialty.update({
    where: { id },
    data: {
      ...input,
      ...(input.name ? { slug: slugify(input.name) } : {}),
    },
  });
}

export async function deleteSpecialty(id: string, user: AuthUser) {
  await assertCanManageSpecialty(id, user);
  await prisma.specialty.delete({ where: { id } });
  return { ok: true };
}