import { prisma } from "../../lib/prisma.js";
import { ContentStatus, Prisma } from "@prisma/client";
import { ForbiddenError, NotFoundError } from "../../utils/errors.js";
import { slugify } from "../../utils/slugify.js";
import { getPagination, paginated } from "../../utils/pagination.js";
import type { Request } from "express";
import type { AuthUser } from "../../types/auth.js";
import type {
  CreateCaseStudyInput,
  UpdateCaseStudyInput,
} from "./caseStudies.validators.js";

const caseStudySelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  diagnosis: true,
  difficulty: true,
  isFree: true,
  status: true,
  author: true,
  institution: true,
  observations: true,
  audioUrl: true,
  audioTitle: true,
  audioTags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
  publishedAt: true,
  createdAt: true,
  specialty: { select: { id: true, name: true, slug: true } },
  tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
  images: {
    select: {
      id: true,
      url: true,
      alt: true,
      tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
    },
  },
  createdBy: { select: { id: true, name: true, email: true } },
  videoCases: {
    select: {
      video: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnailUrl: true,
          isFree: true,
          source: true,
          difficulty: true,
          durationSeconds: true,
          specialty: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  },
} satisfies Prisma.CaseStudySelect;

function caseStudySelectFor(opts?: { admin?: boolean }) {
  return {
    ...caseStudySelect,
    videoCases: {
      ...(opts?.admin ? {} : { where: { video: { status: "PUBLISHED" } } }),
      ...caseStudySelect.videoCases,
    },
  } satisfies Prisma.CaseStudySelect;
}

function stripPrivateFields<T extends { observations?: string | null }>(item: T) {
  const { observations, ...rest } = item;
  void observations;
  return rest;
}

export async function listCaseStudies(query: Request["query"], opts: { admin?: boolean } = {}) {
  const { page, perPage, skip } = getPagination(query);
  const where: Record<string, unknown> = {};

  if (!opts.admin) {
    where.status = "PUBLISHED";
  }

  if (query.search) {
    where.OR = [
      { title: { contains: String(query.search), mode: "insensitive" as const } },
      { description: { contains: String(query.search), mode: "insensitive" as const } },
      { diagnosis: { contains: String(query.search), mode: "insensitive" as const } },
    ];
  }
  if (query.specialty) {
    where.specialty = { is: { OR: [{ id: query.specialty }, { slug: query.specialty }] } };
  }
  if (query.difficulty) {
    where.difficulty = query.difficulty;
  }

  const [items, total] = await Promise.all([
    prisma.caseStudy.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip,
      take: perPage,
      select: caseStudySelectFor(opts),
    }),
    prisma.caseStudy.count({ where }),
  ]);

  return paginated(opts.admin ? items : items.map(stripPrivateFields), total, { page, perPage, skip });
}

export async function getCaseStudy(slugOrId: string, opts: { admin?: boolean } = {}) {
  const caseStudy = await prisma.caseStudy.findFirst({
    where: {
      OR: [{ id: slugOrId }, { slug: slugOrId }],
      ...(opts.admin ? {} : { status: "PUBLISHED" }),
    },
    select: {
      ...caseStudySelectFor(opts),
      relatedCases: {
        select: { related: { select: { id: true, title: true, slug: true, isFree: true, difficulty: true } } },
      },
    },
  });
  if (!caseStudy) throw new NotFoundError("Estudo de caso não encontrado");
  return opts.admin ? caseStudy : stripPrivateFields(caseStudy);
}

export async function listMyCaseStudies(userId: string, query: Request["query"]) {
  const { page, perPage, skip } = getPagination(query);
  const where = { createdById: userId };
  const [items, total] = await Promise.all([
    prisma.caseStudy.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: perPage,
      select: caseStudySelect,
    }),
    prisma.caseStudy.count({ where }),
  ]);
  return paginated(items, total, { page, perPage, skip });
}

export async function createCaseStudy(input: CreateCaseStudyInput, createdById: string) {
  const data: Prisma.CaseStudyCreateInput = {
    title: input.title,
    slug: slugify(input.title),
    description: input.description,
    diagnosis: input.diagnosis,
    difficulty: input.difficulty,
    isFree: input.isFree,
    observations: input.observations,
    audioUrl: input.audioUrl,
    audioTitle: input.audioTitle,
    status: input.status,
    author: input.author,
    institution: input.institution,
    specialty: input.specialtyId ? { connect: { id: input.specialtyId } } : undefined,
    createdBy: { connect: { id: createdById } },
  };

  if (input.status === ContentStatus.PUBLISHED) {
    data.publishedAt = new Date();
  }

  if (input.tagIds.length > 0) {
    data.tags = { create: input.tagIds.map((tagId) => ({ tagId })) };
  }
  if (input.audioTagIds.length > 0) {
    data.audioTags = { create: input.audioTagIds.map((tagId) => ({ tagId })) };
  }
  if (input.videoIds.length > 0) {
    data.videoCases = { create: input.videoIds.map((videoId) => ({ videoId })) };
  }
  if (input.relatedIds.length > 0) {
    data.relatedCases = {
      create: input.relatedIds.map((relatedId) => ({ relatedId })),
    };
  }
  if (input.imageUrls.length > 0) {
    data.images = { create: input.imageUrls.map((url) => ({ url })) };
  }
  if (input.images.length > 0) {
    data.images = {
      create: input.images.map((img) => ({
        url: img.url,
        tags: { create: img.tagIds.map((tagId) => ({ tagId })) },
      })),
    };
  }

  return prisma.caseStudy.create({ data });
}

export async function assertCanManageCaseStudy(idOrSlug: string, user: AuthUser) {
  const caseStudy = await prisma.caseStudy.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
  });
  if (!caseStudy) throw new NotFoundError("Estudo de caso não encontrado");
  if (caseStudy.createdById !== user.id && user.role !== "ADMIN") {
    throw new ForbiddenError("Você só pode gerenciar os próprios conteúdos");
  }
  return caseStudy;
}

export async function updateCaseStudy(id: string, input: UpdateCaseStudyInput, user: AuthUser) {
  const caseStudy = await assertCanManageCaseStudy(id, user);

  const data: Prisma.CaseStudyUpdateInput = {};
  const simpleFields = [
    "title",
    "description",
    "diagnosis",
    "difficulty",
    "isFree",
    "status",
    "author",
    "institution",
    "observations",
    "audioUrl",
    "audioTitle",
  ] as const;

  for (const field of simpleFields) {
    if (input[field] !== undefined) {
      data[field] = (input[field] === "" ? null : input[field]) as never;
    }
  }

  if (input.audioUrl === null && input.audioTitle === undefined) {
    data.audioTitle = null;
    data.audioTags = { deleteMany: {} };
  }
  if (input.audioTagIds !== undefined) {
    data.audioTags = { deleteMany: {}, create: input.audioTagIds.map((tagId) => ({ tagId })) };
  }

  if (input.title) {
    data.slug = slugify(input.title);
  }
  if (input.status === ContentStatus.PUBLISHED) {
    data.publishedAt = new Date();
  }
  if (input.specialtyId !== undefined) {
    data.specialty = input.specialtyId
      ? { connect: { id: input.specialtyId } }
      : { disconnect: true };
  }

  if (input.tagIds !== undefined) {
    data.tags = { deleteMany: {}, create: input.tagIds.map((tagId) => ({ tagId })) };
  }
  if (input.videoIds !== undefined) {
    data.videoCases = { deleteMany: {}, create: input.videoIds.map((videoId) => ({ videoId })) };
  }
  if (input.relatedIds !== undefined) {
    data.relatedCases = {
      deleteMany: {},
      create: input.relatedIds.map((relatedId) => ({ relatedId })),
    };
  }
  if (input.imageUrls !== undefined) {
    data.images = { deleteMany: {}, create: input.imageUrls.map((url) => ({ url })) };
  }
  if (input.images !== undefined) {
    data.images = {
      deleteMany: {},
      create: input.images.map((img) => ({
        url: img.url,
        tags: { create: img.tagIds.map((tagId) => ({ tagId })) },
      })),
    };
  }

  return prisma.caseStudy.update({ where: { id: caseStudy.id }, data });
}

export async function deleteCaseStudy(id: string, user: AuthUser) {
  const caseStudy = await assertCanManageCaseStudy(id, user);
  await prisma.caseStudy.delete({ where: { id: caseStudy.id } });
  return { ok: true };
}

export async function setPublishState(id: string, status: "PUBLISHED" | "DRAFT", user: AuthUser) {
  const caseStudy = await assertCanManageCaseStudy(id, user);
  return prisma.caseStudy.update({
    where: { id: caseStudy.id },
    data: {
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    },
  });
}
