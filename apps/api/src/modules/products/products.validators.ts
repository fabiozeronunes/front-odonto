import { z } from "zod";
import { AccessLevel, ContentStatus } from "@prisma/client";

const imageUrl = z.string().refine(
  (v) => /^https?:\/\//.test(v) || /^\/uploads\//.test(v),
  "URL de imagem inválida"
);

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  perPage: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  onSale: z.string().optional(),
  featured: z.string().optional(),
  accessLevel: z.nativeEnum(AccessLevel).optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(2, "Nome obrigatório").max(200),
  description: z.string().max(5000).optional().nullable(),
  price: z.coerce.number().min(0, "Preço inválido"),
  promoPrice: z.coerce.number().min(0).optional().nullable(),
  sku: z.string().max(60).optional().nullable(),
  stock: z.coerce.number().int().min(0).default(0),
  status: z.nativeEnum(ContentStatus).default(ContentStatus.DRAFT),
  isFeatured: z.boolean().default(false),
  brand: z.string().max(120).optional().nullable(),
  categoryId: z.string().optional().nullable(),
  accessLevel: z.nativeEnum(AccessLevel).default(AccessLevel.PUBLIC),
  tagIds: z.array(z.string()).max(20).default([]),
  imageUrls: z.array(imageUrl).max(10).default([]),
});

export const updateProductSchema = createProductSchema.partial();

export const createProductCategorySchema = z.object({
  name: z.string().min(2, "Nome obrigatório").max(120),
  isActive: z.boolean().optional(),
});

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Produto obrigatório"),
        quantity: z.coerce.number().int().min(1, "Quantidade inválida").max(99),
      })
    )
    .min(1, "Carrinho vazio")
    .max(50),
});

export type ProductQueryInput = z.infer<typeof productQuerySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateProductCategoryInput = z.infer<typeof createProductCategorySchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
