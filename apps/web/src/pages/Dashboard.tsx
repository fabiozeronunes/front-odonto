import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, History, Sparkles, User, LogOut, LayoutGrid, HandCoins, Wallet, BookOpen, Video as VideoIcon } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { Paginated, Video } from "../types";
import { VideoCard } from "../components/VideoCard";
import { AffiliateShareCard } from "../components/AffiliateShareCard";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { BackButton } from "../components/BackButton";

export function Dashboard() {
  const { user, logout } = useAuth();
  const [recent, setRecent] = useState<{ watchedAt: string; video: Video }[]>([]);
  const [loading, setLoading] = useState(true);
  const isPremium = user?.role === "ADMIN" || (!!user?.plan && user.plan.slug !== "gratuito");

  useEffect(() => {
    api<Paginated<{ watchedAt: string; video: Video }>>("/api/videos/me/history?perPage=6")
      .then((data) => setRecent(data.data))
      .catch(() => setRecent([]))
      .finally(() => setLoading(false));
  }, []);

  const dashBtn = "h-9 px-4 text-[9px] font-medium uppercase tracking-wide";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <BackButton to="/" />
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Olá, {user?.name.split(" ")[0]}
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
            <Button variant="outline" className={dashBtn}>
              <Heart className="h-4 w-4" /> Favoritos
            </Button>
          </Link>
          <Link to="/catalogo">
            <Button className={dashBtn}>Explorar vídeos</Button>
          </Link>
          <Link to="/meus-conteudos">
            <Button variant="outline" className={dashBtn}>
              <LayoutGrid className="h-4 w-4" /> Meu espaço
            </Button>
          </Link>
          <Link to="/perfil">
            <Button variant="outline" className={dashBtn}>
              <User className="h-4 w-4" /> Perfil
            </Button>
          </Link>
          <Link to="/financeiro">
            <Button variant="outline" className={dashBtn}>
              <Wallet className="h-4 w-4" /> Dados financeiros
            </Button>
          </Link>
          <Link to="/meus-estudos">
            <Button variant="outline" className={dashBtn}>
              <BookOpen className="h-4 w-4" /> Meus estudos
            </Button>
          </Link>
          <Button variant="outline" onClick={logout} className={`${dashBtn} text-red-600 hover:text-red-700`}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </div>

      {user?.isAffiliate && (
        <div className="mt-8 space-y-3">
          <AffiliateShareCard />
          <Link to="/comissoes">
            <Button variant="outline" className={`w-full sm:w-auto ${dashBtn}`}>
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
        <div className="mb-6 rounded-2xl border border-border bg-surface p-4 shadow-card">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-accent-50 px-2 py-0.5 text-[9px] font-medium uppercase text-accent-700 dark:bg-accent-900 dark:text-accent-200">
              Continue de onde parou:
            </span>
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <History className="h-5 w-5 text-primary-700" /> Continuar assistindo
            </h2>
          </div>
        </div>        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-video animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <VideoIcon className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">Nenhum vídeo assistido</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Você ainda não assistiu a nenhum vídeo.
            </p>
            <Link to="/catalogo" className="mt-4">
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

    </div>
  );
}
