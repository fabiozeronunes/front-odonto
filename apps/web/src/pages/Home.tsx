import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ShoppingBag, Package, Check } from "lucide-react";
import { Plans } from "./Plans";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { api } from "../lib/api";
import { useCart } from "../lib/cart";
import { formatPrice, resolveImageUrl } from "../lib/utils";
import type { Product } from "../types";

function ShopPreview() {
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState<Record<string, boolean>>({});

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
    <section className="py-12 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <ShoppingBag className="h-5 w-5 text-primary-700" /> Shop Odontus
          </h2>
          <Link to="/loja">
            <Button variant="ghost" size="sm">
              Ver todos
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-sm text-slate-500">Novos produtos em breve.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {products.map((p) => {
              const price = Number(p.price);
              const promo = Number(p.promoPrice);
              const discount = promo > 0 && promo < price ? Math.round((1 - promo / price) * 100) : 0;
              const img = p.images?.[0]?.url;
              return (
                <div
                  key={p.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card transition-shadow hover:shadow-lift"
                >
                  <Link to="/loja" className="block">
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-50">
                      {img ? (
                        <img src={resolveImageUrl(img)} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-slate-300">
                          <Package className="h-8 w-8" />
                        </span>
                      )}
                      {discount > 0 && (
                        <span className="absolute left-1.5 top-1.5 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          -{discount}%
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col p-3">
                    <Link to="/loja">
                      <p className="line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-primary-800">
                        {p.name}
                      </p>
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {p.brand ?? "Odontus"}
                      {p.category ? ` • ${p.category.name}` : ""}
                    </p>
                    <div className="mt-2 flex items-baseline gap-2">
                      {discount > 0 && (
                        <span className="text-xs text-slate-400 line-through">{formatPrice(p.price)}</span>
                      )}
                      <span className="text-base font-bold text-slate-900">{formatPrice(p.promoPrice)}</span>
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
  return (
    <div className="min-h-screen bg-background">
      {/* ===== FIRST FOLD: HERO ===== */}
      <section
        className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-800 to-teal-700 text-white"
      >
        <div
          className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl"
        />
        <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-accent-400/20 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div className="relative">
            <Badge className="bg-white/15 text-white hover:bg-white/20">
              <Sparkles className="h-3 w-3" /> Plataforma de estudos odontológicos
            </Badge>

            <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Domine a <span className="inline-block">Odontologia</span> com Aulas em Vídeo, Imagens e
              Estudos de Casos.
            </h1>

            <p className="mt-5 max-w-xl text-lg text-white/80 leading-relaxed text-justify">
              Aprenda por especialidades, estudos de casos reais e evolua seus estudos com Quizz,
              Flashcards, Questionários que vão ajudar na sua formação e aprendizado.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/planos">
                <Button
                  size="lg"
                  variant="premium"
                  className="h-12 px-8 font-medium transition-all duration-200 hover:bg-white/20"
                >
                  Conhecer Planos
                </Button>
              </Link>
              <Link to="/cadastro">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 font-medium bg-white text-slate-900 border-2 border-white/20 hover:bg-white/90 hover:text-slate-900 transition-colors"
                >
                  Acesso Gratuito
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl animate-float-slow" />
      </section>

      {/* ===== SHOP ODONTUS ===== */}
      <ShopPreview />

      {/* ===== PLANS SECTION ===== */}
      <section className="py-12 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Plans />
        </div>
      </section>
    </div>
  );
}