import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ShoppingBag, Package, Check, PlayCircle } from "lucide-react";
import { Plans } from "./Plans";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { api } from "../lib/api";
import { useCart } from "../lib/cart";
import { cn, formatPrice, resolveImageUrl } from "../lib/utils";
import type { Product } from "../types";

function ShopPreview() {
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [rows, setRows] = useState<"2" | "4">(() => {
    try {
      return localStorage.getItem("odonto_shop_rows") === "4" ? "4" : "2";
    } catch {
      return "4";
    }
  });

  function changeRows(value: "2" | "4") {
    setRows(value);
    try {
      localStorage.setItem("odonto_shop_rows", value);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    api<{ data: Product[] }>("/api/products?perPage=4")
      .then((d) => setProducts(d.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  function handleAdd(p: Product) {
    addItem(p, 1);
    setAdded((prev) => ({ ...prev, [p.id]: true }));
    setTimeout(() => setAdded((prev) => ({ ...prev, [p.id]: false })), 1500);
  }

  return (
    <section className="py-12 bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-foreground">
            <ShoppingBag className="h-5 w-5 text-primary-700 dark:text-primary-400" /> Shop Odontus
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Por linha:</span>
              <div className="inline-flex overflow-hidden rounded-lg border border-border">
                {(["2", "4"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => changeRows(value)}
                    className={cn(
                      "px-3 py-1 font-semibold transition-colors",
                      rows === value
                        ? "bg-primary-700 text-primary-foreground"
                        : "bg-surface text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            <Link to="/loja">
              <Button variant="ghost" size="sm" className="text-primary-700 dark:text-primary-400">
                Ver todos
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-sm text-muted-foreground">Novos produtos em breve.</p>
        ) : (
          <div
            className={cn(
              "grid gap-4 sm:gap-6",
              rows === "4" ? "grid-cols-2 lg:grid-cols-4" : "mx-auto max-w-2xl grid-cols-1 sm:grid-cols-2"
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
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <Link to={`/loja/${p.slug}`} className="block">
                    <div className="relative aspect-[4/3] overflow-hidden bg-white">
                      {img ? (
                        <img
                          src={resolveImageUrl(img)}
                          alt={p.name}
                          className="h-full w-full object-contain transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <Package className="h-8 w-8" />
                        </span>
                      )}
                      {discount > 0 && (
                        <span className="absolute left-1.5 top-1.5 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          -{discount}%
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col p-3">
                    <Link to={`/loja/${p.slug}`}>
                      <p className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary-800 dark:group-hover:text-primary-300">
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
                      <span className="font-display text-base font-bold text-foreground">
                        {formatPrice(p.promoPrice)}
                      </span>
                    </div>
                    <Button size="sm" className="mt-3 w-full" onClick={() => handleAdd(p)}>
                      {added[p.id] ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                      {added[p.id] ? "Adicionado" : "Carrinho"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export function Home() {
  const [heroVideo, setHeroVideo] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api<{ data: string | null }>("/api/settings/hero-video", { skipAuth: true })
      .then((res) => {
        if (active) setHeroVideo(res.data ?? null);
      })
      .catch(() => {
        if (active) setHeroVideo(null);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* ===== FIRST FOLD: HERO ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-800 to-teal-700 text-white">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />

        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:py-24">
          {/* Bloco de vídeo da hero (configurável no admin) */}
          <div className="relative mx-auto max-w-3xl animate-fade-in-up anim-delay-200">
            {heroVideo ? (
              <div className="overflow-hidden rounded-3xl border border-teal-400/30 shadow-lift">
                <iframe
                  src={heroVideo}
                  title="Vídeo da Front Odontus"
                  className="aspect-video w-full bg-black"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-teal-400/30 bg-primary-950/60 shadow-lift backdrop-blur">
                <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600 shadow-glow animate-pulse-ring">
                    <PlayCircle className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            )}
            <div className="absolute -right-4 top-8 animate-float rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground shadow-lift">
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-accent" /> Plano Premium ativo
            </div>
            <div className="absolute -left-6 bottom-10 animate-float-slow rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground shadow-lift">
              🛒 -20% em kits
            </div>
          </div>

          <div className="mt-10 text-center">
            <Badge className="animate-fade-in-up rounded-full border border-teal-400/40 bg-primary-900/60 px-4 py-1.5 text-teal-200 hover:bg-primary-900/60">
              <Sparkles className="h-3 w-3" /> Plataforma de estudos odontológicos
            </Badge>

            <h1 className="mx-auto mt-5 max-w-4xl font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl animate-fade-in-up anim-delay-100">
              Domine a{" "}
              <span className="bg-gradient-to-r from-teal-300 to-amber-400 bg-clip-text text-transparent">
                Odontologia
              </span>{" "}
              Estudando por Vídeos, Imagens e Estudos de Casos.
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/80 animate-fade-in-up anim-delay-200">
              Aprenda por especialidades, estude casos reais e evolua com Quizz, Flashcards e
              Questionários que vão ajudar na sua formação e aprendizado.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center animate-fade-in-up anim-delay-200">
              <Link to="/cadastro">
                <Button
                  size="lg"
                  variant="premium"
                  className="h-12 w-full px-8 font-semibold shadow-glow sm:w-auto"
                >
                  <PlayCircle className="h-5 w-5" /> Começar a estudar grátis
                </Button>
              </Link>
              <a href="#planos">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 w-full border-2 border-white/25 bg-white/10 px-8 font-semibold text-white hover:bg-white/20 hover:text-white sm:w-auto"
                >
                  Ver planos
                </Button>
              </a>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-10 border-t border-teal-400/25 pt-6 animate-fade-in-up anim-delay-300">
              <div>
                <p className="font-display text-2xl font-bold sm:text-3xl">mais de 300</p>
                <p className="text-sm text-teal-200">vídeos</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold sm:text-3xl">+2.000</p>
                <p className="text-sm text-teal-200">alunos ativos</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold sm:text-3xl">4.9★</p>
                <p className="text-sm text-teal-200">avaliação média</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute -right-6 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-teal-400/10 blur-3xl animate-float-slow" />
      </section>

      {/* ===== SHOP ODONTUS ===== */}
      <ShopPreview />

      {/* ===== PLANS SECTION ===== */}
      <section id="planos" className="scroll-mt-16 bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Plans />
        </div>
      </section>
    </div>
  );
}