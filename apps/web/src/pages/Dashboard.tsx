import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, History, Sparkles } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { Paginated, Video } from "../types";
import { VideoCard } from "../components/VideoCard";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

export function Dashboard() {
  const { user } = useAuth();
  const [recent, setRecent] = useState<{ watchedAt: string; video: Video }[]>([]);
  const [loading, setLoading] = useState(true);
  const isPremium = user?.plan?.slug === "premium";

  useEffect(() => {
    api<Paginated<{ watchedAt: string; video: Video }>>("/api/videos/me/history?perPage=6")
      .then((data) => setRecent(data.data))
      .catch(() => setRecent([]))
      .finally(() => setLoading(false));
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
        </div>
        {loading ? (
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
    </div>
  );
}
