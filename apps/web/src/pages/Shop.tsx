import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Package, Percent, Loader2, X, SlidersHorizontal } from "lucide-react";
import { api } from "../lib/api";
import type { Paginated, Product, ProductCategory } from "../types";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Select } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { CountdownTimer } from "../components/CountdownTimer";
import { cn, formatPrice, resolveImageUrl } from "../lib/utils";

const PER_PAGE = 12;

export function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PER_PAGE);
  const isLoadMoreRef = useRef(false);
  const [rows, setRows] = useState<"1" | "2">(() => {
    try {
      return localStorage.getItem("odonto_shop_rows") === "1" ? "1" : "2";
    } catch {
      return "2";
    }
  });

  function changeRows(value: "1" | "2") {
    setRows(value);
    try {
      localStorage.setItem("odonto_shop_rows", value);
    } catch {
      /* ignore */
    }
  }

  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const onSale = searchParams.get("onSale") === "true";
  const sort = searchParams.get("sort") ?? "recent";

  const filterKey = [search, category, onSale, sort].join("|");

  useEffect(() => {
    api<{ data: ProductCategory[] }>("/api/products/categories")
      .then((d) => setCategories(d.data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const isLoadMore = isLoadMoreRef.current;
    isLoadMoreRef.current = false;
    if (!isLoadMore) setLoading(true);

    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("perPage", String(visibleCount));
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (onSale) params.set("onSale", "true");
    params.set("sort", sort);

    api<Paginated<Product>>(`/api/products?${params.toString()}`)
      .then((data) => {
        setProducts(data.data);
      })
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  }, [filterKey, visibleCount]);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setSearchParams(next);
  }

  function loadMore() {
    if (loadingMore) return;
    isLoadMoreRef.current = true;
    setLoadingMore(true);
    setVisibleCount((c) => c + PER_PAGE);
  }

  const activeFilterCount = [category, onSale].filter(Boolean).length;

  const gridClass =
    rows === "2"
      ? "grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4"
      : "mx-auto max-w-3xl grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Shop Odontus</h1>
      </div>

      <div className="mb-8 rounded-2xl border border-border bg-surface p-4 shadow-card">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 rounded-full bg-accent-50 px-2 py-0.5 text-[9px] font-medium uppercase text-accent-700 dark:bg-accent-900 dark:text-accent-200">
            Ordenar:
          </span>
          <button
            type="button"
            onClick={() => updateParam("sort", "recent")}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full px-4 text-[9px] font-medium uppercase tracking-wide transition-colors",
              sort === "recent"
                ? "bg-primary-700 text-primary-foreground shadow-sm"
                : "border border-border bg-surface text-foreground hover:bg-muted"
            )}
          >
            <Package className="h-4 w-4" /> Mais recentes
          </button>
          <button
            type="button"
            onClick={() => updateParam("sort", "popular")}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full px-4 text-[9px] font-medium uppercase tracking-wide transition-colors",
              sort === "popular"
                ? "bg-accent-600 text-white shadow-sm"
                : "border border-border bg-surface text-foreground hover:bg-muted"
            )}
          >
            <Percent className="h-4 w-4" /> Mais vendidos
          </button>
          <button
            type="button"
            onClick={() => updateParam("sort", "price_asc")}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full px-4 text-[9px] font-medium uppercase tracking-wide transition-colors",
              sort === "price_asc"
                ? "bg-green-700 text-white shadow-sm"
                : "border border-border bg-surface text-foreground hover:bg-muted"
            )}
          >
            <Percent className="h-4 w-4" /> Menor preço
          </button>
          <button
            type="button"
            onClick={() => updateParam("sort", "price_desc")}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full px-4 text-[9px] font-medium uppercase tracking-wide transition-colors",
              sort === "price_desc"
                ? "bg-green-700 text-white shadow-sm"
                : "border border-border bg-surface text-foreground hover:bg-muted"
            )}
          >
            <Percent className="h-4 w-4" /> Maior preço
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <span className="mr-1 rounded-full bg-accent-50 px-2 py-0.5 text-[9px] font-medium uppercase text-accent-700 dark:bg-accent-900 dark:text-accent-200">
            Produtos por linha:
          </span>
          <div className="inline-flex overflow-hidden rounded-lg border border-border">
            {(["1", "2"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => changeRows(value)}
                className={cn(
                  "px-4 py-1.5 text-[9px] font-medium uppercase tracking-wide transition-colors",
                  rows === value
                    ? "bg-primary-700 text-primary-foreground"
                    : "bg-surface text-muted-foreground hover:bg-muted"
                )}
              >
                {value}
              </button>
            ))}
          </div>
          <span className="ml-1 text-xs text-muted-foreground">
            {rows === "1" ? "1 por linha no celular · 2 no tablet" : "2 por linha no celular · 3 no tablet"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              defaultValue={search}
              placeholder="Buscar produto..."
              className="pl-9"
              onChange={(e) => updateParam("search", e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters((s) => !s)}
              aria-expanded={showFilters}
            >
              <SlidersHorizontal className="h-4 w-4" /> Filtros
              {activeFilterCount > 0 && (
                <Badge variant="default" className="ml-1">{activeFilterCount}</Badge>
              )}
            </Button>
            {(search || activeFilterCount > 0) && (
              <Button variant="ghost" onClick={() => {
                const next = new URLSearchParams();
                setSearchParams(next);
              }}>
                <X className="h-4 w-4" /> Limpar
              </Button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select value={category} onChange={(e) => updateParam("category", e.target.value)}>
              <option value="">Todas categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            <Select value={onSale ? "true" : ""} onChange={(e) => updateParam("onSale", e.target.value)}>
              <option value="">Todos</option>
              <option value="true">Apenas ofertas</option>
            </Select>
          </div>
        )}
      </div>

      {activeFilterCount > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-accent-50 px-2 py-0.5 text-[9px] font-medium uppercase text-accent-700 dark:bg-accent-900 dark:text-accent-200">
            Filtros ativos:
          </span>
          <Button variant="ghost" size="sm" onClick={() => {
            const next = new URLSearchParams();
            setSearchParams(next);
          }}>
            Limpar filtros
          </Button>
        </div>
      )}

      {loading ? (
        <div className={gridClass}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <Package className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">Nenhum produto encontrado</h3>
          <p className="mt-1 text-sm text-muted-foreground">Tente ajustar os filtros ou buscar por outro termo.</p>
        </div>
      ) : (
        <>
          <div className={gridClass}>
            {products.map((p) => {
              const price = Number(p.price);
              const promo = Number(p.promoPrice);
              const discount = promo > 0 && promo < price ? Math.round((1 - promo / price) * 100) : 0;
              const img = p.images?.[0]?.url;
              return (
                <Link
                  key={p.id}
                  to={`/loja/${p.slug}`}
                  className="group block"
                >
                  <Card className="overflow-hidden transition-all group-hover:-translate-y-0.5 group-hover:shadow-lift">
                    <div className="relative aspect-[4/3] overflow-hidden bg-white">
                      {img ? (
                        <img src={resolveImageUrl(img)} alt={p.name} className="h-full w-full object-contain transition-transform group-hover:scale-105" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-muted-foreground">
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
                    <CardContent className="p-4">
                      <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary-800 dark:group-hover:text-primary-300">
                        {p.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {p.brand ?? "Odontus"}
                        {p.category ? ` • ${p.category.name}` : ""}
                      </p>
                      <div className="mt-2 flex items-baseline gap-2">
                        {discount > 0 && (
                          <span className="text-xs text-muted-foreground line-through">{formatPrice(p.price)}</span>
                        )}
                        <span className="font-display text-base font-bold text-foreground sm:text-lg">
                          {formatPrice(p.promoPrice)}
                        </span>
                      </div>
                      {p.saleEndsAt && (
                        <CountdownTimer startsAt={p.saleStartsAt} endsAt={p.saleEndsAt} className="mt-3" />
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
          {visibleCount < products.length && (
            <div className="mt-10 flex justify-center">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                {loadingMore ? "Carregando..." : "Carregar mais produtos"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}