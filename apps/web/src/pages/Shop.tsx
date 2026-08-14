import { useEffect, useState } from "react";
import { Search, ShoppingBag, Package, Percent } from "lucide-react";
import { api } from "../lib/api";
import type { Paginated, Product, ProductCategory } from "../types";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { cn, formatPrice, resolveImageUrl } from "../lib/utils";

export function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [onSale, setOnSale] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    api<{ data: ProductCategory[] }>("/api/products/categories")
      .then((d) => setCategories(d.data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ perPage: "12", page: String(page) });
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (onSale) params.set("onSale", "true");
    api<Paginated<Product>>(`/api/products?${params.toString()}`)
      .then((d) => {
        setProducts(d.data);
        setTotalPages(d.pagination.totalPages);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [page, search, category, onSale]);

  function applyFilter(key: "category" | "onSale" | "search", value: string | boolean) {
    setPage(1);
    if (key === "category") setCategory(value as string);
    if (key === "onSale") setOnSale(value as boolean);
    if (key === "search") setSearch(value as string);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900">
            <ShoppingBag className="h-7 w-7 text-primary-700" /> Shop Odontus
          </h1>
          <p className="mt-1 text-slate-500">
            Kits, uniformes, instrumentais e materiais odontológicos com desconto para assinantes.
          </p>
        </div>
        <div className="w-full sm:w-64">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => applyFilter("search", e.target.value)}
              placeholder="Buscar produto..."
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => applyFilter("category", "")}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            category === "" ? "bg-primary-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          Todos
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => applyFilter("category", c.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              category === c.id ? "bg-primary-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {c.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => applyFilter("onSale", !onSale)}
          className={cn(
            "ml-auto inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
            onSale ? "bg-red-600 text-white" : "bg-red-50 text-red-600 hover:bg-red-100"
          )}
        >
          <Percent className="h-4 w-4" /> Somente ofertas
        </button>
      </div>

      {loading ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center">
          <Package className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-slate-500">Nenhum produto encontrado.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => {
            const price = Number(p.price);
            const promo = Number(p.promoPrice);
            const discount = promo > 0 && promo < price ? Math.round((1 - promo / price) * 100) : 0;
            const img = p.images?.[0]?.url;
            return (
              <div
                key={p.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition-shadow hover:shadow-lift"
              >
                <div className="relative aspect-[4/3] bg-slate-50">
                  {img ? (
                    <img src={resolveImageUrl(img)} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-slate-300">
                      <Package className="h-10 w-10" />
                    </span>
                  )}
                  {discount > 0 && (
                    <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                      -{discount}%
                    </span>
                  )}
                  {p.stock <= 0 && (
                    <span className="absolute right-2 top-2 rounded-full bg-slate-800/80 px-2 py-0.5 text-xs font-semibold text-white">
                      Esgotado
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{p.name}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {p.brand ?? "Odontus"}
                        {p.category ? ` • ${p.category.name}` : ""}
                      </p>
                    </div>
                    {p.isFeatured && <Badge variant="premium">Destaque</Badge>}
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    {discount > 0 && (
                      <span className="text-sm text-slate-400 line-through">{formatPrice(p.price)}</span>
                    )}
                    <span className="text-lg font-bold text-slate-900">{formatPrice(p.promoPrice)}</span>
                  </div>
                  {p.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">{p.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-slate-500">
            Página {page} de {Math.max(totalPages, 1)}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}
