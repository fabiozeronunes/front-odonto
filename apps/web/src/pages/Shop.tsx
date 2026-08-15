import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, Package, Percent, Check, Loader2 } from "lucide-react";
import { api } from "../lib/api";
import { useCart } from "../lib/cart";
import type { Paginated, Product, ProductCategory } from "../types";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { CountdownTimer } from "../components/CountdownTimer";
import { cn, formatPrice, resolveImageUrl } from "../lib/utils";

const PER_PAGE = 9;

export function Shop() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [onSale, setOnSale] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [rows, setRows] = useState<"2" | "3">(() => {
    try {
      return localStorage.getItem("odonto_shop_rows") === "2" ? "2" : "3";
    } catch {
      return "3";
    }
  });

  function changeRows(value: "2" | "3") {
    setRows(value);
    try {
      localStorage.setItem("odonto_shop_rows", value);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    api<{ data: ProductCategory[] }>("/api/products/categories")
      .then((d) => setCategories(d.data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ perPage: String(PER_PAGE), page: "1" });
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
  }, [search, category, onSale]);

  async function loadMore() {
    const next = page + 1;
    setLoadingMore(true);
    const params = new URLSearchParams({ perPage: String(PER_PAGE), page: String(next) });
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (onSale) params.set("onSale", "true");
    try {
      const d = await api<Paginated<Product>>(`/api/products?${params.toString()}`);
      setProducts((prev) => [...prev, ...d.data]);
      setPage(next);
      setTotalPages(d.pagination.totalPages);
    } catch {
      /* ignore */
    } finally {
      setLoadingMore(false);
    }
  }

  function applyFilter(key: "category" | "onSale" | "search", value: string | boolean) {
    setPage(1);
    if (key === "category") setCategory(value as string);
    if (key === "onSale") setOnSale(value as boolean);
    if (key === "search") setSearch(value as string);
  }

  function handleAdd(p: Product) {
    addItem(p, 1);
    setAdded((prev) => ({ ...prev, [p.id]: true }));
    setTimeout(() => setAdded((prev) => ({ ...prev, [p.id]: false })), 1500);
  }

  function handleBuy(p: Product) {
    addItem(p, 1);
    navigate("/checkout-loja");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="flex items-center gap-2 font-display text-3xl font-bold text-foreground">
            <ShoppingBag className="h-7 w-7 text-primary-700 dark:text-primary-400" /> Shop Odontus
          </h1>
          <p className="mt-1 text-muted-foreground">
            Kits, uniformes, instrumentais e materiais odontológicos com desconto para assinantes.
          </p>
        </div>
        <div className="w-full sm:w-64">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
            category === "" ? "bg-primary-700 text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
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
              category === c.id ? "bg-primary-700 text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
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
            onSale ? "bg-red-600 text-white" : "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
          )}
        >
          <Percent className="h-4 w-4" /> Somente ofertas
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Produtos por linha:</span>
        <div className="inline-flex overflow-hidden rounded-lg border border-border">
          {(["2", "3"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => changeRows(value)}
              className={cn(
                "px-4 py-1.5 font-semibold transition-colors",
                rows === value ? "bg-primary-700 text-primary-foreground" : "bg-surface text-muted-foreground hover:bg-muted"
              )}
            >
              {value} produtos
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface p-16 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">Nenhum produto encontrado.</p>
        </div>
      ) : (
        <div
          className={cn(
            "mt-8 grid gap-4 sm:gap-6",
            rows === "3" ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3" : "mx-auto max-w-2xl grid-cols-1 sm:grid-cols-2"
          )}
        >
          {products.map((p) => {
            const price = Number(p.price);
            const promo = Number(p.promoPrice);
            const discount = promo > 0 && promo < price ? Math.round((1 - promo / price) * 100) : 0;
            const img = p.images?.[0]?.url;
            return (
              <div
                key={p.id}
                className="group flex flex-col rounded-2xl border border-border bg-surface shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <Link to={`/loja/${p.slug}`} className="block">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-white">
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
                </Link>
                <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
                  <Link to={`/loja/${p.slug}`} className="block">
                    <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary-800 dark:group-hover:text-primary-300">
                      {p.name}
                    </p>
                  </Link>
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
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:pt-1">
                    <Button
                      variant="outline"
                      className="w-full sm:flex-1"
                      disabled={p.stock <= 0}
                      onClick={() => handleAdd(p)}
                    >
                      {added[p.id] ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                      {added[p.id] ? "Adicionado" : "Carrinho"}
                    </Button>
                    <Button className="w-full sm:flex-1" disabled={p.stock <= 0} onClick={() => handleBuy(p)}>
                      Comprar
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {page < totalPages && (
        <div className="mt-8 flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
            {loadingMore ? "Carregando..." : "Carregar mais produtos"}
          </Button>
        </div>
      )}
    </div>
  );
}