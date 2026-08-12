import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { api } from "../lib/api";
import type { Paginated, Video } from "../types";
import { VideoCard } from "../components/VideoCard";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";

export function Favorites() {
  const [items, setItems] = useState<{ createdAt: string; video: Video }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Paginated<{ createdAt: string; video: Video }>>("/api/videos/me/favorites?perPage=24")
      .then((data) => setItems(data.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900">
        <Heart className="h-7 w-7 fill-red-500 text-red-500" /> Meus favoritos
      </h1>
      <p className="mt-1 text-slate-500">Vídeos que você salvou para assistir depois.</p>

      <div className="mt-8">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-video animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center">
            <Heart className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-slate-500">Nenhum favorito ainda.</p>
            <Link to="/catalogo" className="mt-4 inline-block">
              <Button>Explorar catálogo</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(({ video }) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
