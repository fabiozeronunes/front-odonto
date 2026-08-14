import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, History, Sparkles, ShoppingBag, Percent, Package } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { Paginated, Product, Video } from "../types";
import { VideoCard } from "../components/VideoCard";
import { AffiliateShareCard } from "../components/AffiliateShareCard";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { formatPrice, resolveImageUrl } from "../lib/utils";

export function Dashboard() {
  const { user } = useAuth();
  const [recent, setRecent] = useState<{ watchedAt: string; video: Video }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saleProducts, setSaleProducts] = useState<Product[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const isPremium = !!user?.plan && user.plan.slug !== "gratuito";

  useEffect(() => {
    api<Paginated<{ watchedAt: string; video: Video }>>("/api/videos/me/history?perPage=6")
      .then((data) => setRecent(data.data))
      .catch(() => setRecent([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api<Paginated<Product>>("/api/products?perPage=8&onSale=true")
      .then((data) => setSaleProducts(data.data))
      .catch(() => setSaleProducts([]))
      .finally(() => setLoadingSales(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Olá, {user?.name.split(" ")[0]} 👋
          </h1>
          <div className="mt-2 flex items-center gap-2">
            {isPremium ? (
              <Badge variant="premium">
                <Sparkles className="h-3 w-3" /> Plano Premium
              </Badge>
            ) : (
              <Badge variant="free">Plano Gratuito</Badge>
            )}
            <span className="text-sm text-slate-500">{user?.email}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/favoritos">
            <Button variant="outline">
              <Heart className="h-4 w-4" /> Favoritos
            </Button>
          </Link>
          <Link to="/catalogo">
            <Button>Explorar vídeos</Button>
          </Link>
        </div>
      </div>

      {user?.isAffiliate && (
        <div className="mt-8">
          <AffiliateShareCard />
        </div>
      )}

      {!isPremium && (
        <div className="mt-8 flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white sm:flex-row sm:items-center">
          <div>
            <p className="text-lg font-bold">Desbloqueie conteúdos premium</p>
            <p className="text-sm text-amber-100">
              Acesse todos os vídeos, estudos de caso exclusivos e benefícios.
            </p>
          </div>
          <Link to="/planos">
            <Button variant="premium" className="bg-white text-amber-700 hover:bg-amber-50">
              Assinar Premium
            </Button>
          </Link>
        </div>
      )}

      <section className="mt-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <History className="h-5 w-5 text-primary-700" /> Continuar assistindo
          </h2>
        </div>        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-video animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-slate-500">Você ainda não assistiu a nenhum vídeo.</p>
            <Link to="/catalogo" className="mt-4 inline-block">
              <Button>Começar a estudar</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map(({ video }) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <ShoppingBag className="h-5 w-5 text-primary-700" /> Ofertas e descontos em produtos
          </h2>
          <Link to="/catalogo">
            <Button variant="outline" size="sm">
              <Percent className="h-4 w-4" /> Ver todas as ofertas
            </Button>
          </Link>
        </div>
        <p className="mb-5 -mt-3 text-sm text-slate-500">
          Descontos exclusivos em kits, uniformes e materiais odontológicos para assinantes.
        </p>
        {loadingSales ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : saleProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Package className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-slate-500">Novas ofertas em breve.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {saleProducts.map((p) => {
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
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-semibold text-slate-900">{p.name}</p>
                    <p className="truncate text-xs text-slate-400">
                      {p.brand ?? "—"}
                      {p.category ? ` • ${p.category.name}` : ""}
                    </p>
                    <div className="mt-2 flex items-baseline gap-2">
                      {discount > 0 && (
                        <span className="text-xs text-slate-400 line-through">{formatPrice(p.price)}</span>
                      )}
                      <span className="text-sm font-bold text-emerald-700">{formatPrice(p.promoPrice)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
