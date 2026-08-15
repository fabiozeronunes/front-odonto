import { prisma } from "../../lib/prisma.js";
import { ContentStatus, Prisma } from "@prisma/client";
import { ConflictError, NotFoundError } from "../../utils/errors.js";
import { slugify } from "../../utils/slugify.js";
import { getPagination, paginated } from "../../utils/pagination.js";
import type { Request } from "express";
import type {
  CreateOrderInput,
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
  saleStartsAt: true,
  saleEndsAt: true,
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
    saleStartsAt: input.saleStartsAt ? new Date(input.saleStartsAt) : null,
    saleEndsAt: input.saleEndsAt ? new Date(input.saleEndsAt) : null,
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

  if (input.saleStartsAt !== undefined) {
    data.saleStartsAt = input.saleStartsAt ? new Date(input.saleStartsAt) : null;
  }
  if (input.saleEndsAt !== undefined) {
    data.saleEndsAt = input.saleEndsAt ? new Date(input.saleEndsAt) : null;
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

const orderSelect = {
  id: true,
  status: true,
  subtotal: true,
  discount: true,
  total: true,
  createdAt: true,
  items: {
    select: {
      id: true,
      quantity: true,
      unitPrice: true,
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          images: { select: { id: true, url: true, alt: true } },
        },
      },
    },
  },
} satisfies Prisma.OrderSelect;

export async function createOrder(userId: string, input: CreateOrderInput) {
  const productIds = input.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: ContentStatus.PUBLISHED },
    select: { id: true, price: true, promoPrice: true, stock: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  let discount = 0;
  const items: { productId: string; quantity: number; unitPrice: number }[] = [];

  for (const item of input.items) {
    const product = byId.get(item.productId);
    if (!product) throw new NotFoundError("Produto não encontrado ou indisponível");
    if (product.stock < item.quantity) {
      throw new ConflictError("Estoque insuficiente para um dos produtos");
    }
    const price = Number(product.price);
    const promo = Number(product.promoPrice);
    const unitPrice = promo > 0 && promo < price ? promo : price;
    subtotal += price * item.quantity;
    discount += (price - unitPrice) * item.quantity;
    items.push({ productId: product.id, quantity: item.quantity, unitPrice });
  }

  const total = Math.max(0, subtotal - discount);

  return prisma.order.create({
    data: {
      userId,
      status: "PENDING",
      subtotal,
      discount,
      total,
      items: { create: items },
    },
    select: orderSelect,
  });
}

export async function confirmOrder(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId, status: "PENDING" },
    include: { items: { include: { product: { select: { name: true } } } } },
  });
  if (!order) throw new NotFoundError("Pedido não encontrado");

  await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new NotFoundError("Produto não encontrado");
      if (product.stock < item.quantity) {
        throw new ConflictError("Estoque insuficiente para um dos produtos");
      }
    }
    await tx.order.update({ where: { id: orderId }, data: { status: "PAID" } });
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }
  });

  const referred = await prisma.user.findUnique({
    where: { id: userId },
    select: { referredById: true },
  });

  if (referred?.referredById && order.items.length > 0) {
    const affiliate = await prisma.user.findUnique({
      where: { id: referred.referredById },
      select: { id: true, isAffiliate: true, productCommissionRate: true },
    });
    if (affiliate?.isAffiliate) {
      const existing = await prisma.affiliateCommission.findFirst({
        where: {
          affiliateId: affiliate.id,
          referredUserId: userId,
          source: "PRODUCT",
          status: "PENDING",
        },
      });
      if (!existing) {
        const amount = Math.round(Number(order.total) * Number(affiliate.productCommissionRate)) / 100;
        const productName = order.items.map((it) => it.product.name).filter(Boolean).join(", ");
        await prisma.affiliateCommission.create({
          data: {
            affiliateId: affiliate.id,
            referredUserId: userId,
            amount,
            percent: Number(affiliate.productCommissionRate),
            source: "PRODUCT",
            productName: productName || null,
          },
        });
      }
    }
  }

  return { ok: true, orderId };
}

export async function listMyOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: orderSelect,
  });
}

export async function listOrders() {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      ...orderSelect,
      user: { select: { id: true, name: true, email: true, registrationNumber: true } },
    },
  });
}

export async function deleteOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Pedido não encontrado");
  await prisma.$transaction(async (tx) => {
    await tx.orderItem.deleteMany({ where: { orderId } });
    await tx.order.delete({ where: { id: orderId } });
  });
  return { ok: true, orderId };
}
