import { prisma } from "../../lib/prisma.js";
import { ContentStatus, Prisma } from "@prisma/client";
import { ConflictError, NotFoundError } from "../../utils/errors.js";
import { slugify } from "../../utils/slugify.js";
import { getPagination, paginated } from "../../utils/pagination.js";
import type { Request } from "express";
import type {
  CreateProductCategoryInput,
  CreateProductInput,
  ProductQueryInput,
  UpdateProductInput,
} from "./products.validators.js";

const productSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  promoPrice: true,
  sku: true,
  stock: true,
  status: true,
  isFeatured: true,
  brand: true,
  accessLevel: true,
  createdAt: true,
  category: { select: { id: true, name: true, slug: true } },
  tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
  images: { select: { id: true, url: true, alt: true } },
} satisfies Prisma.ProductSelect;

export async function listProducts(query: ProductQueryInput, opts: { admin?: boolean } = {}) {
  const { page, perPage, skip } = getPagination({
    page: String(query.page ?? 1),
    perPage: String(query.perPage ?? 12),
  });
  const where: Record<string, unknown> = {};

  if (!opts.admin) {
    where.status = ContentStatus.PUBLISHED;
  }

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" as const } },
      { brand: { contains: query.search, mode: "insensitive" as const } },
      { sku: { contains: query.search, mode: "insensitive" as const } },
      { description: { contains: query.search, mode: "insensitive" as const } },
      {
        category: {
          is: { name: { contains: query.search, mode: "insensitive" as const } },
        },
      },
      {
        tags: { some: { tag: { name: { contains: query.search, mode: "insensitive" as const } } } },
      },
    ];
  }
  if (query.category) {
    where.category = { is: { OR: [{ id: query.category }, { slug: query.category }] } };
  }
  if (query.tag) {
    where.tags = { some: { tag: { OR: [{ id: query.tag }, { slug: query.tag }] } } };
  }
  if (query.accessLevel) {
    where.accessLevel = query.accessLevel;
  }
  if (query.featured === "true") {
    where.isFeatured = true;
  }
  if (query.onSale === "true") {
    where.promoPrice = { not: null, lt: prisma.product.fields.price };
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: opts.admin ? { createdAt: "desc" } : [{ isFeatured: "desc" }, { createdAt: "desc" }],
      skip,
      take: perPage,
      select: productSelect,
    }),
    prisma.product.count({ where }),
  ]);

  return paginated(items, total, { page, perPage, skip });
}

export async function getProduct(slugOrId: string, opts: { admin?: boolean } = {}) {
  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id: slugOrId }, { slug: slugOrId }],
      ...(opts.admin ? {} : { status: ContentStatus.PUBLISHED }),
    },
    select: productSelect,
  });
  if (!product) throw new NotFoundError("Produto não encontrado");
  return product;
}

export async function createProduct(input: CreateProductInput) {
  const data: Prisma.ProductCreateInput = {
    name: input.name,
    slug: slugify(input.name),
    description: input.description,
    price: input.price,
    promoPrice: input.promoPrice,
    sku: input.sku,
    stock: input.stock,
    status: input.status,
    isFeatured: input.isFeatured,
    brand: input.brand,
    accessLevel: input.accessLevel,
    category: input.categoryId ? { connect: { id: input.categoryId } } : undefined,
  };

  if (input.tagIds.length > 0) {
    data.tags = { create: input.tagIds.map((tagId) => ({ tagId })) };
  }
  if (input.imageUrls.length > 0) {
    data.images = { create: input.imageUrls.map((url) => ({ url })) };
  }

  return prisma.product.create({ data });
}

export async function assertCanManageProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw new NotFoundError("Produto não encontrado");
  return product;
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  await assertCanManageProduct(id);

  const data: Prisma.ProductUpdateInput = {};
  const simpleFields = [
    "name",
    "description",
    "price",
    "promoPrice",
    "sku",
    "stock",
    "status",
    "isFeatured",
    "brand",
    "accessLevel",
  ] as const;

  for (const field of simpleFields) {
    if (input[field] !== undefined) {
      data[field] = (input[field] === "" ? null : input[field]) as never;
    }
  }

  if (input.name) {
    data.slug = slugify(input.name);
  }
  if (input.categoryId !== undefined) {
    data.category = input.categoryId ? { connect: { id: input.categoryId } } : { disconnect: true };
  }
  if (input.tagIds !== undefined) {
    data.tags = { deleteMany: {}, create: input.tagIds.map((tagId) => ({ tagId })) };
  }
  if (input.imageUrls !== undefined) {
    data.images = { deleteMany: {}, create: input.imageUrls.map((url) => ({ url })) };
  }

  return prisma.product.update({ where: { id }, data });
}

export async function deleteProduct(id: string) {
  await assertCanManageProduct(id);
  await prisma.product.delete({ where: { id } });
  return { ok: true };
}

export async function listCategories() {
  const categories = await prisma.productCategory.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      _count: { select: { products: true } },
    },
  });
  return categories;
}

export async function createCategory(input: CreateProductCategoryInput) {
  const existing = await prisma.productCategory.findFirst({
    where: { name: input.name },
  });
  if (existing) throw new ConflictError("Categoria já cadastrada");
  return prisma.productCategory.create({
    data: { name: input.name, slug: slugify(input.name) },
  });
}

export async function updateCategory(id: string, input: Partial<CreateProductCategoryInput>) {
  const category = await prisma.productCategory.findUnique({ where: { id } });
  if (!category) throw new NotFoundError("Categoria não encontrada");
  const data: Prisma.ProductCategoryUpdateInput = {};
  if (input.name !== undefined) {
    data.name = input.name;
    data.slug = slugify(input.name);
  }
  if (input.isActive !== undefined) {
    data.isActive = input.isActive;
  }
  return prisma.productCategory.update({ where: { id }, data });
}

export async function deleteCategory(id: string) {
  const category = await prisma.productCategory.findUnique({ where: { id } });
  if (!category) throw new NotFoundError("Categoria não encontrada");
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    throw new ConflictError("Exclua ou mova os produtos desta categoria antes de removê-la");
  }
  await prisma.productCategory.delete({ where: { id } });
  return { ok: true };
}
