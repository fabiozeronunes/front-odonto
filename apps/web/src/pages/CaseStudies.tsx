import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlayCircle, Clock, BookOpen } from "lucide-react";
import { api } from "../lib/api";
import type { Paginated, CaseStudy } from "../types";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { formatDuration, resolveImageUrl } from "../lib/utils";

export function CaseStudies() {
  const [items, setItems] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Paginated<CaseStudy>>("/api/case-studies?perPage=24")
      .then((data) => setItems(data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Estudos de caso</h1>
        <p className="mt-1 text-muted-foreground">
          Casos clínicos comentados para aprofundar seu aprendizado.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">Nenhum estudo de caso publicado.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((cs) => {
            const video = cs.videoCases?.[0]?.video;
            return (
              <div
                key={cs.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card"
              >
                {video && (
                  <Link
                    to={`/video/${video.slug}`}
                    state={{ fromCaseStudies: true }}
                    className="group relative block aspect-video overflow-hidden bg-muted"
                  >
                    {video.thumbnailUrl ? (
                      <img
                        src={resolveImageUrl(video.thumbnailUrl)}
                        alt={video.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-700 to-teal-600">
                        <PlayCircle className="h-12 w-12 text-white/80" />
                      </div>
                    )}
                    <div className="absolute left-2 top-2 flex gap-2">
                      {video.isFree ? (
                        <Badge variant="free">GRATUITO</Badge>
                      ) : (
                        <Badge variant="premium">Pago</Badge>
                      )}
                      <Badge variant="info" className="bg-slate-900 text-white">
                        <BookOpen className="h-3.5 w-3.5" />
                      </Badge>
                    </div>
                    {video.durationSeconds ? (
                      <div className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs text-white">
                        <Clock className="mr-1 inline h-3 w-3" />
                        {formatDuration(video.durationSeconds)}
                      </div>
                    ) : null}
                  </Link>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={cs.isFree ? "free" : "premium"}>
                      {cs.isFree ? "GRATUITO" : "PREMIUM"}
                    </Badge>
                    {cs.createdBy?.role === "ADMIN" && <Badge variant="default">Front Odontus</Badge>}
                    <span className="ml-auto text-xs capitalize text-muted-foreground">
                      {cs.difficulty.toLowerCase()}
                    </span>
                  </div>
                  <h3 className="mt-3 font-semibold text-foreground">{cs.title}</h3>
                  <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">{cs.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {cs.specialty?.name ?? "Geral"} · {cs.author ?? "Anônimo"}
                    </span>
                    <Link to={`/casos/${cs.slug}`}>
                      <Button variant="outline" size="sm">
                        Ver caso
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
