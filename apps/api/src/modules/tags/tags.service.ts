import { prisma } from "../../lib/prisma.js";
import { ForbiddenError, NotFoundError } from "../../utils/errors.js";
import { slugify } from "../../utils/slugify.js";
import { getPagination, paginated } from "../../utils/pagination.js";
import type { Request } from "express";
import type { AuthUser } from "../../types/auth.js";
import type { CreateTagInput, UpdateTagInput } from "./tags.validators.js";

export async function listTags(query: Request["query"]) {
  const { page, perPage, skip } = getPagination(query);

  const where = {
    isActive: query.all === "true" ? undefined : true,
    name: query.search
      ? { contains: String(query.search), mode: "insensitive" as const }
      : undefined,
  };

  const [items, total] = await Promise.all([
    prisma.tag.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take: perPage,
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdById: true,
        _count: {
          select: {
            videos: { where: { video: { status: "PUBLISHED" } } },
            caseStudies: { where: { caseStudy: { status: "PUBLISHED" } } },
          },
        },
      },
    }),
    prisma.tag.count({ where }),
  ]);

  return paginated(items, total, { page, perPage, skip });
}

export async function listMyTags(userId: string) {
  return prisma.tag.findMany({
    where: { createdById: userId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      _count: {
        select: {
          videos: { where: { video: { status: "PUBLISHED" } } },
          caseStudies: { where: { caseStudy: { status: "PUBLISHED" } } },
        },
      },
    },
  });
}

export async function getTag(slugOrId: string) {
  const tag = await prisma.tag.findFirst({
    where: { OR: [{ id: slugOrId }, { slug: slugOrId }] },
    include: {
      videos: {
        where: { video: { status: "PUBLISHED" } },
        orderBy: { video: { publishedAt: "desc" } },
        take: 12,
        select: {
          video: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnailUrl: true,
              isFree: true,
              difficulty: true,
              publishedAt: true,
            },
          },
        },
      },
    },
  });
  if (!tag) throw new NotFoundError("Tag não encontrada");
  return tag;
}

export async function createTag(input: CreateTagInput, createdById?: string) {
  const existing = await prisma.tag.findFirst({
    where: { name: { equals: input.name, mode: "insensitive" } },
  });
  if (existing) return existing;

  return prisma.tag.create({
    data: {
      name: input.name,
      slug: slugify(input.name),
      createdBy: createdById ? { connect: { id: createdById } } : undefined,
    },
  });
}

export async function assertCanManageTag(id: string, user: AuthUser) {
  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) throw new NotFoundError("Tag não encontrada");
  if (user.role !== "ADMIN" && tag.createdById !== user.id) {
    throw new ForbiddenError("Você só pode gerenciar as próprias tags");
  }
  return tag;
}

export async function updateTag(id: string, input: UpdateTagInput, user: AuthUser) {
  await assertCanManageTag(id, user);
  return prisma.tag.update({
    where: { id },
    data: {
      ...input,
      ...(input.name ? { slug: slugify(input.name) } : {}),
    },
  });
}

export async function deleteTag(id: string, user: AuthUser) {
  await assertCanManageTag(id, user);
  await prisma.tag.delete({ where: { id } });
  return { ok: true };
}