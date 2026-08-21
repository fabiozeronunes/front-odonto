import { prisma } from "../../lib/prisma.js";
import { ContentStatus, Prisma } from "@prisma/client";
import { ForbiddenError, NotFoundError } from "../../utils/errors.js";
import { slugify } from "../../utils/slugify.js";
import { getPagination, paginated } from "../../utils/pagination.js";
import type { Request } from "express";
import type { AuthUser } from "../../types/auth.js";
import type { CreateVideoInput, UpdateVideoInput, VideoQueryInput } from "./videos.validators.js";

const publishedWhere = { status: "PUBLISHED" as const };

function buildWhere(query: VideoQueryInput, opts: { admin?: boolean } = {}) {
  const where: Record<string, unknown> = {};

  if (!opts.admin) {
    where.status = "PUBLISHED";
  }

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" as const } },
      { description: { contains: query.search, mode: "insensitive" as const } },
      { author: { contains: query.search, mode: "insensitive" as const } },
      { institution: { contains: query.search, mode: "insensitive" as const } },
      {
        specialty: {
          is: { name: { contains: query.search, mode: "insensitive" as const } },
        },
      },
      {
        tags: { some: { tag: { name: { contains: query.search, mode: "insensitive" as const } } } },
      },
    ];
  }

  if (query.specialty) {
    where.specialty = { is: { OR: [{ id: query.specialty }, { slug: query.specialty }] } };
  }
  if (query.tag) {
    where.tags = { some: { tag: { OR: [{ id: query.tag }, { slug: query.tag }] } } };
  }
  if (query.imageTag) {
    where.images = {
      some: { tags: { some: { tag: { OR: [{ id: query.imageTag }, { slug: query.imageTag }] } } } },
    };
  }
  if (query.caseStudy) {
    where.caseStudies = {
      some: { caseStudy: { OR: [{ id: query.caseStudy }, { slug: query.caseStudy }] } },
    };
  }
  if (query.difficulty) {
    where.difficulty = query.difficulty;
  }
  if (query.isFree) {
    where.isFree = query.isFree === "true";
  }
  if (query.source) {
    where.source = query.source;
  }

  const hasActiveFilter = Boolean(
    query.search ||
      query.specialty ||
      query.tag ||
      query.caseStudy ||
      query.imageTag ||
      query.difficulty ||
      query.isFree ||
      query.source
  );

  if (!opts.admin && !hasActiveFilter) {
    where.caseStudies = { none: {} };
  }

  return where;
}

function buildOrderBy(sort?: string) {
  switch (sort) {
    case "popular":
      return [{ viewCount: "desc" as const }, { publishedAt: "desc" as const }];
    case "oldest":
      return [{ publishedAt: "asc" as const }];
    default:
      return [{ publishedAt: "desc" as const }];
  }
}

// v2 - force redeploy to apply VideoAudio migration
const videoSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  thumbnailUrl: true,
  videoType: true,
  videoUrl: true,
  durationSeconds: true,
  difficulty: true,
  isFree: true,
  source: true,
  author: true,
  institution: true,
  observations: true,
  status: true,
  publishedAt: true,
  viewCount: true,
  audioUrl: true,
  audioTitle: true,
  audios: {
    select: {
      id: true,
      url: true,
      title: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  },
  specialty: { select: { id: true, name: true, slug: true } },
  tags: {
    select: { tag: { select: { id: true, name: true, slug: true } } },
  },
  audioTags: {
    select: { tag: { select: { id: true, name: true, slug: true } } },
  },
  images: {
    select: {
      id: true,
      url: true,
      alt: true,
      tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
    },
  },
  createdBy: { select: { id: true, name: true, email: true } },
} satisfies Prisma.VideoSelect;

export function stripPrivateFields<T extends { observations?: string | null }>(item: T) {
  const { observations, ...rest } = item;
  void observations;
  return rest;
}

export async function listVideos(query: VideoQueryInput, opts: { admin?: boolean } = {}) {
  const { page, perPage, skip } = getPagination({
    page: String(query.page ?? 1),
    perPage: String(query.perPage ?? 12),
  });
  const where = buildWhere(query, opts);

  const [items, total] = await Promise.all([
    prisma.video.findMany({
      where,
      orderBy: buildOrderBy(query.sort),
      skip,
      take: perPage,
      select: videoSelect,
    }),
    prisma.video.count({ where }),
  ]);

  return paginated(opts.admin ? items : items.map(stripPrivateFields), total, { page, perPage, skip });
}

export async function listMyVideos(userId: string, query: Request["query"]) {
  const { page, perPage, skip } = getPagination(query);
  const where = { createdById: userId };
  const [items, total] = await Promise.all([
    prisma.video.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: perPage,
      select: videoSelect,
    }),
    prisma.video.count({ where }),
  ]);
  return paginated(items, total, { page, perPage, skip });
}

export async function getVideo(slugOrId: string, opts: { admin?: boolean } = {}) {
  const video = await prisma.video.findFirst({
    where: {
      OR: [{ id: slugOrId }, { slug: slugOrId }],
      ...(opts.admin ? {} : publishedWhere),
    },
    select: {
      ...videoSelect,
      caseStudies: {
        select: {
          caseStudy: {
            select: {
              id: true,
              title: true,
              slug: true,
              description: true,
              diagnosis: true,
              difficulty: true,
              isFree: true,
            },
          },
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!video) throw new NotFoundError("Vídeo não encontrado");

  if (!opts.admin && video.status === "PUBLISHED") {
    await prisma.video.update({
      where: { id: video.id },
      data: { viewCount: { increment: 1 } },
    });
  }

  const related = await getRelatedVideos(video.id, video.specialty?.id ?? null, video.tags.map((t) => t.tag.id));
  const relatedImages = await getRelatedImages(video.id, video.tags.map((t) => t.tag.id));
  const relatedCaseStudies = await getRelatedCaseStudies(video.id, video.tags.map((t) => t.tag.id));

  return {
    video: opts.admin ? video : stripPrivateFields(video),
    related: related.map(stripPrivateFields),
    relatedImages,
    relatedCaseStudies,
  };
}

export async function getRelatedImages(videoId: string, tagIds: string[]) {
  if (tagIds.length === 0) return [];

  return prisma.media.findMany({
    where: {
      OR: [
        { videoId: { not: videoId }, video: { status: "PUBLISHED" } },
        { videoId: null, caseStudy: { status: "PUBLISHED" } },
      ],
      tags: { some: { tagId: { in: tagIds } } },
    },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      id: true,
      url: true,
      alt: true,
      tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
      video: { select: { id: true, title: true, slug: true } },
      caseStudy: { select: { id: true, title: true, slug: true } },
    },
  });
}

export async function getRelatedCaseStudies(videoId: string, tagIds: string[]) {
  const or: Prisma.CaseStudyWhereInput["OR"] = [{ videoCases: { some: { videoId } } }];
  if (tagIds.length > 0) {
    or.push({ tags: { some: { tagId: { in: tagIds } } } });
  }

  return prisma.caseStudy.findMany({
    where: {
      status: "PUBLISHED",
      OR: or,
    },
    orderBy: { publishedAt: "desc" },
    take: 4,
    select: {
      id: true,
      title: true,
      slug: true,
      difficulty: true,
      isFree: true,
      videoCases: {
        take: 1,
        select: {
          video: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnailUrl: true,
              isFree: true,
            },
          },
        },
      },
    },
  });
}

export async function getRelatedVideos(
  videoId: string,
  specialtyId: string | null,
  tagIds: string[]
) {
  if (!specialtyId && tagIds.length === 0) return [];

  const related = await prisma.video.findMany({
    where: {
      id: { not: videoId },
      status: "PUBLISHED",
      caseStudies: { none: {} },
      OR: [
        ...(specialtyId ? [{ specialtyId }] : []),
        ...(tagIds.length > 0 ? [{ tags: { some: { tagId: { in: tagIds } } } }] : []),
      ],
    },
    orderBy: [{ viewCount: "desc" }, { publishedAt: "desc" }],
    take: 8,
    select: videoSelect,
  });

  return related;
}

export async function getVideoRelatedContent(videoId: string) {
  const caseStudies = await prisma.videoCaseStudy.findMany({
    where: { videoId },
    select: { caseStudyId: true },
  });
  const caseStudyIds = caseStudies.map((c) => c.caseStudyId);

  if (caseStudyIds.length === 0) {
    return { videos: [], images: [] };
  }

  const [videos, images] = await Promise.all([
    prisma.video.findMany({
      where: {
        id: { not: videoId },
        status: "PUBLISHED",
        caseStudies: { some: { caseStudyId: { in: caseStudyIds } } },
      },
      orderBy: [{ publishedAt: "desc" }],
      take: 6,
      select: videoSelect,
    }),
    prisma.media.findMany({
      where: {
        caseStudyId: { in: caseStudyIds },
        tags: { some: {} },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        url: true,
        alt: true,
        tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
        caseStudy: { select: { id: true, title: true, slug: true } },
      },
    }),
  ]);

  return { videos, images };
}

async function ensureUniqueVideoSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugify(title) || "video";
  let slug = base;
  let i = 2;
  while (
    await prisma.video.findFirst({ where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) } })
  ) {
    slug = `${base}-${i}`;
    i++;
  }
  return slug;
}

export async function createVideo(input: CreateVideoInput, createdById: string, isAdmin = false) {
  const data: Prisma.VideoCreateInput = {
    title: input.title,
    slug: await ensureUniqueVideoSlug(input.title),
    description: input.description,
    thumbnailUrl: input.thumbnailUrl || null,
    videoType: input.videoType,
    videoUrl: input.videoUrl,
    durationSeconds: input.durationSeconds,
    difficulty: input.difficulty,
    isFree: input.isFree,
    source: isAdmin ? input.source ?? "FRONTODONTUS" : "STUDENT",
    author: input.author,
    institution: input.institution,
    observations: input.observations,
    status: isAdmin ? input.status : input.status ?? ContentStatus.DRAFT,
    specialty: input.specialtyId ? { connect: { id: input.specialtyId } } : undefined,
    createdBy: { connect: { id: createdById } },
  };

  if (data.status === ContentStatus.PUBLISHED) {
    data.publishedAt = new Date();
  }

  if (input.tagIds.length > 0) {
    data.tags = { create: input.tagIds.map((tagId) => ({ tagId })) };
  }
  if (input.audioTagIds.length > 0) {
    data.audioTags = { create: input.audioTagIds.map((tagId) => ({ tagId })) };
  }
  if (input.caseStudyIds.length > 0) {
    data.caseStudies = {
      create: input.caseStudyIds.map((caseStudyId) => ({ caseStudyId })),
    };
  }
  if (input.imageUrls.length > 0) {
    data.images = { create: input.imageUrls.map((url) => ({ url })) };
  }
  if (input.images.length > 0) {
    data.images = { create: input.images.map((img) => ({ url: img.url, tags: { create: img.tagIds.map((tagId) => ({ tagId })) } })) };
  }
  if (input.audios && input.audios.length > 0) {
    data.audios = { create: input.audios.map((a) => ({ url: a.url, title: a.title })) };
  }

  return prisma.video.create({ data, include: { audios: true } });
}

export async function assertCanManageVideo(idOrSlug: string, user: AuthUser) {
  const video = await prisma.video.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
  });
  if (!video) throw new NotFoundError("Vídeo não encontrado");
  if (video.createdById !== user.id && user.role !== "ADMIN") {
    throw new ForbiddenError("Você só pode gerenciar os próprios conteúdos");
  }
  return video;
}

export async function updateVideo(id: string, input: UpdateVideoInput, user: AuthUser) {
  const video = await assertCanManageVideo(id, user);

  const data: Prisma.VideoUpdateInput = {};
  data.updatedAt = new Date();
  const simpleFields = [
    "title",
    "description",
    "thumbnailUrl",
    "videoType",
    "videoUrl",
    "durationSeconds",
    "difficulty",
    "isFree",
    "source",
    "author",
    "institution",
    "observations",
    "status",
  ] as const;

  for (const field of simpleFields) {
    if (input[field] !== undefined) {
      data[field] = (input[field] === "" ? null : input[field]) as never;
    }
  }

  if (input.title) {
    data.slug = await ensureUniqueVideoSlug(input.title, video.id);
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
  if (input.audioTagIds !== undefined) {
    data.audioTags = { deleteMany: {}, create: input.audioTagIds.map((tagId) => ({ tagId })) };
  }
  if (input.caseStudyIds !== undefined) {
    data.caseStudies = {
      deleteMany: {},
      create: input.caseStudyIds.map((caseStudyId) => ({ caseStudyId })),
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
  if (input.audios && input.audios.length > 0) {
    data.audios = {
      deleteMany: {},
      create: input.audios.map((a) => ({ url: a.url, title: a.title })),
    };
  }

  return prisma.video.update({ where: { id: video.id }, data, include: { audios: true } });
}

export async function deleteVideo(id: string, user: AuthUser) {
  const video = await assertCanManageVideo(id, user);
  await prisma.video.delete({ where: { id: video.id } });
  return { ok: true };
}

export async function setPublishState(id: string, status: "PUBLISHED" | "DRAFT", user: AuthUser) {
  const video = await assertCanManageVideo(id, user);
  return prisma.video.update({
    where: { id: video.id },
    data: {
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    },
  });
}

async function resolveVideoId(slugOrId: string) {
  const video = await prisma.video.findFirst({
    where: { OR: [{ id: slugOrId }, { slug: slugOrId }] },
    select: { id: true },
  });
  if (!video) throw new NotFoundError("Vídeo não encontrado");
  return video.id;
}

export async function toggleFavorite(userId: string, videoId: string) {
  const id = await resolveVideoId(videoId);

  const existing = await prisma.favorite.findUnique({
    where: { userId_videoId: { userId, videoId: id } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return { favorited: false };
  }

  await prisma.favorite.create({ data: { userId, videoId: id } });
  return { favorited: true };
}

export async function listFavorites(userId: string, query: Request["query"]) {
  const { page, perPage, skip } = getPagination(query);
  const where = { userId };
  const [items, total] = await Promise.all([
    prisma.favorite.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
      select: {
        createdAt: true,
        video: { select: videoSelect },
      },
    }),
    prisma.favorite.count({ where }),
  ]);
  return paginated(items, total, { page, perPage, skip });
}

export async function recordWatch(userId: string, videoId: string) {
  const id = await resolveVideoId(videoId);

  const existing = await prisma.watchHistory.findUnique({
    where: { userId_videoId: { userId, videoId: id } },
  });

  if (existing) {
    await prisma.watchHistory.update({
      where: { id: existing.id },
      data: { watchedAt: new Date() },
    });
  } else {
    await prisma.watchHistory.create({ data: { userId, videoId: id } });
  }

  return { ok: true };
}

export async function listWatchHistory(userId: string, query: Request["query"]) {
  const { page, perPage, skip } = getPagination(query);
  const where = { userId };
  const [items, total] = await Promise.all([
    prisma.watchHistory.findMany({
      where,
      orderBy: { watchedAt: "desc" },
      skip,
      take: perPage,
      select: {
        watchedAt: true,
        video: { select: videoSelect },
      },
    }),
    prisma.watchHistory.count({ where }),
  ]);
  return paginated(items, total, { page, perPage, skip });
}

export async function listImageTags() {
  const tags = await prisma.tag.findMany({
    where: { media: { some: { media: { videoId: { not: null } } } } },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });
  return tags;
}

export async function searchImages(tag?: string) {
  if (!tag) return [];
  const media = await prisma.media.findMany({
    where: {
      videoId: { not: null },
      video: { status: "PUBLISHED" },
      tags: {
        some: {
          tag: {
            OR: [
              { name: { contains: tag, mode: "insensitive" } },
              { id: tag },
              { slug: tag },
            ],
          },
        },
      },
    },
    orderBy: { video: { publishedAt: "desc" } },
    take: 60,
    select: {
      id: true,
      url: true,
      tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
      video: { select: { id: true, title: true, slug: true } },
    },
  });
  return media;
}
