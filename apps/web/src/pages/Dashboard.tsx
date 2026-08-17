import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, History, Sparkles, ShoppingBag, Percent, Package, User, LogOut, LayoutGrid, HandCoins, Wallet, BookOpen } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { Paginated, Product, Video } from "../types";
import { VideoCard } from "../components/VideoCard";
import { AffiliateShareCard } from "../components/AffiliateShareCard";
import { CountdownTimer } from "../components/CountdownTimer";
import { Button } from "../components/ui/button";
import { useMediaQuery } from "../lib/useMediaQuery";
import { Badge } from "../components/ui/badge";
import { formatPrice, resolveImageUrl, cn } from "../lib/utils";

export function Dashboard() {
  const { user, logout } = useAuth();
  const [recent, setRecent] = useState<{ watchedAt: string; video: Video }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saleProducts, setSaleProducts] = useState<Product[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const isTablet = useMediaQuery("(min-width: 768px)");
  const [rows, setRows] = useState<"1" | "2" | "3">(() => {
    try {
      return localStorage.getItem("odonto_dashboard_sale_rows") === "1" ? "1" : "3";
    } catch {
      return "3";
    }
  });
  const isPremium = user?.role === "ADMIN" || (!!user?.plan && user.plan.slug !== "gratuito");

  function changeRows(value: "1" | "2" | "3") {
    setRows(value);
    try {
      localStorage.setItem("odonto_dashboard_sale_rows", value);
    } catch {
      /* ignore */
    }
  }

  const activeRows: "1" | "2" | "3" = isTablet ? (rows === "1" ? "2" : rows) : rows === "3" ? "2" : rows;

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
          <h1 className="text-3xl font-bold text-foreground">
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
            <span className="text-sm text-muted-foreground">{user?.email}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/favoritos">
            <Button variant="outline">
              <Heart className="h-4 w-4" /> Favoritos
            </Button>
          </Link>
          <Link to="/catalogo">
            <Button>Explorar vídeos</Button>
          </Link>
          <Link to="/meus-conteudos">
            <Button variant="outline">
              <LayoutGrid className="h-4 w-4" /> Meu espaço
            </Button>
          </Link>
          <Link to="/perfil">
            <Button variant="outline">
              <User className="h-4 w-4" /> Perfil
            </Button>
          </Link>
          <Link to="/financeiro">
            <Button variant="outline">
              <Wallet className="h-4 w-4" /> Dados financeiros
            </Button>
          </Link>
          <Link to="/meus-estudos">
            <Button variant="outline">
              <BookOpen className="h-4 w-4" /> Meus estudos
            </Button>
          </Link>
          <Button variant="outline" onClick={logout} className="text-red-600 hover:text-red-700">
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </div>

      {user?.isAffiliate && (
        <div className="mt-8 space-y-3">
          <AffiliateShareCard />
          <Link to="/comissoes">
            <Button variant="outline" className="w-full sm:w-auto">
              <HandCoins className="h-4 w-4" /> Minhas comissões
            </Button>
          </Link>
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
            <Button variant="premium" className="bg-surface text-amber-700 hover:bg-amber-50">
              Assinar Premium
            </Button>
          </Link>
        </div>
      )}

      <section className="mt-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <History className="h-5 w-5 text-primary-700" /> Continuar assistindo
          </h2>
        </div>        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-video animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
            <p className="text-muted-foreground">Você ainda não assistiu a nenhum vídeo.</p>
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
          <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <ShoppingBag className="h-5 w-5 text-primary-700" /> Ofertas e descontos em produtos
          </h2>
          <Link to="/loja">
            <Button variant="outline" size="sm">
              <Percent className="h-4 w-4" /> Ver todas as ofertas
            </Button>
          </Link>
        </div>
        <p className="mb-5 -mt-3 text-sm text-muted-foreground">
          Descontos exclusivos em kits, uniformes e materiais odontológicos para assinantes.
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Produtos por linha:</span>
          <div className="inline-flex overflow-hidden rounded-lg border border-border">
            {(isTablet ? (["2", "3"] as const) : (["1", "2"] as const)).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => changeRows(value)}
                className={cn(
                  "px-4 py-1.5 font-semibold transition-colors",
                  activeRows === value ? "bg-primary-700 text-primary-foreground" : "bg-surface text-muted-foreground hover:bg-muted"
                )}
              >
                {value} produto{value === "2" || value === "3" ? "s" : ""}
              </button>
            ))}
          </div>
        </div>

        {loadingSales ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : saleProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
            <Package className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">Novas ofertas em breve.</p>
          </div>
        ) : (
          <div
            className={cn(
              "grid gap-4 sm:gap-6",
              activeRows === "2"
                ? "grid-cols-2"
                : activeRows === "3"
                ? "grid-cols-2 md:grid-cols-3"
                : "mx-auto max-w-2xl grid-cols-1"
            )}
          >
            {saleProducts.map((p) => {
              const price = Number(p.price);
              const promo = Number(p.promoPrice);
              const discount = promo > 0 && promo < price ? Math.round((1 - promo / price) * 100) : 0;
              const img = p.images?.[0]?.url;
              return (
                <Link
                  key={p.id}
                  to={`/loja/${p.slug}`}
                  className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <div className="relative aspect-[4/3] bg-white">
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
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.brand ?? "—"}
                      {p.category ? ` • ${p.category.name}` : ""}
                    </p>
                    <div className="mt-2 flex items-baseline gap-2">
                      {discount > 0 && (
                        <span className="text-xs text-muted-foreground line-through">{formatPrice(p.price)}</span>
                      )}
                      <span className="text-sm font-bold text-emerald-700">{formatPrice(p.promoPrice)}</span>
                    </div>
                    {p.saleEndsAt && (
                      <CountdownTimer startsAt={p.saleStartsAt} endsAt={p.saleEndsAt} className="mt-3" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
