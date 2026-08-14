import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Flame, Clock } from "lucide-react";
import { Plans } from "./Plans";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { VideoCard } from "../components/VideoCard";
import { api } from "../lib/api";
import type { Paginated, Video } from "../types";

function VideoSection({
  title,
  icon,
  sort,
}: {
  title: string;
  icon: React.ReactNode;
  sort: "recent" | "popular";
}) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Paginated<Video>>(`/api/videos?sort=${sort}&perPage=6`)
      .then((d) => setVideos(d.data))
      .finally(() => setLoading(false));
  }, [sort]);

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            {icon}
            {title}
          </h2>
          <Link to={`/catalogo?sort=${sort}`}>
            <Button variant="ghost" size="sm">
              Ver todos
            </Button>
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-video animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : videos.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum vídeo disponível ainda.</p>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
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

      {/* ===== VIDEOS SECTIONS ===== */}
      <section className="py-12 bg-white">
        <VideoSection title="Vídeos novos" icon={<Clock className="h-5 w-5 text-primary-600" />} sort="recent" />
      </section>

      <section className="py-12 bg-slate-50">
        <VideoSection title="Mais assistidos" icon={<Flame className="h-5 w-5 text-accent-500" />} sort="popular" />
      </section>

      {/* ===== PLANS SECTION ===== */}
      <section className="py-12 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Plans />
        </div>
      </section>
    </div>
  );
}
