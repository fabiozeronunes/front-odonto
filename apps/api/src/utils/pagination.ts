import { Request } from "express";

export interface PaginationOptions {
  page: number;
  perPage: number;
  skip: number;
}

export function getPagination(query: Request["query"]): PaginationOptions {
  const page = Math.max(1, Number(query.page ?? 1));
  const perPage = Math.min(50, Math.max(1, Number(query.perPage ?? 12)));
  return { page, perPage, skip: (page - 1) * perPage };
}

export function paginated<T>(data: T[], total: number, { page, perPage }: PaginationOptions) {
  return {
    data,
    pagination: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    },
  };
}
