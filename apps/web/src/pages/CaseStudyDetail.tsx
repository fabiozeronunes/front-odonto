import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Stethoscope, User, Building2, Tag as TagIcon, ArrowRight, Images as ImagesIcon, AudioLines, X } from "lucide-react";
import { api, ApiRequestError } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { CaseStudy, Video } from "../types";
import { VideoCard } from "../components/VideoCard";
import { StudySection } from "../components/StudySection";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { resolveImageUrl } from "../lib/utils";

interface CaseStudyDetail extends CaseStudy {
  videoCases: { video: Video }[];
  relatedCases: { related: { id: string; title: string; slug: string; isFree: boolean; difficulty: string } }[];
}

function hasPremiumAccess(user: { role?: string; plan?: { slug: string } } | null) {
  return user?.role === "ADMIN" || (!!user?.plan && user.plan.slug !== "gratuito");
}

export function CaseStudyDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<CaseStudyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api<CaseStudyDetail>(`/api/case-studies/${slug}`)
      .then((d) => setData(d))
      .catch((e) => setError(e instanceof ApiRequestError ? e.message : "Erro ao carregar caso"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
        <div className="mt-6 h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-foreground">Erro</h1>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Link to="/casos" className="mt-4 inline-block">
          <Button variant="outline">Voltar aos casos</Button>
        </Link>
      </div>
    );
  }

  if (!data.isFree && !hasPremiumAccess(user)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <Badge variant="premium" className="mb-4">CONTEÚDO PREMIUM</Badge>
        <h1 className="text-2xl font-bold text-foreground">{data.title}</h1>
        <p className="mt-2 text-muted-foreground">
          {isAuthenticated
            ? "Você não tem permissão para acessar este estudo de caso. Assine o plano Premium para desbloquear."
            : "Este estudo de caso é exclusivo para membros premium. Faça login ou assine o plano Premium para desbloquear."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/planos">
            <Button variant="premium">Assinar Premium</Button>
          </Link>
          {!isAuthenticated && (
            <Button variant="outline" onClick={() => navigate("/login")}>
              Fazer login
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link to="/casos" className="text-sm font-medium text-primary-700 hover:text-primary-800">
        ← Voltar aos estudos de caso
      </Link>

      <div className="mt-4 rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={data.isFree ? "free" : "premium"}>
            {data.isFree ? "GRATUITO" : "PREMIUM"}
          </Badge>
          <Badge variant="info" className="capitalize">{data.difficulty.toLowerCase()}</Badge>
          {data.specialty && <Badge variant="outline">{data.specialty.name}</Badge>}
        </div>

        <h1 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">{data.title}</h1>

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {data.author && (
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" /> {data.author}
            </span>
          )}
          {data.institution && (
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" /> {data.institution}
            </span>
          )}
        </div>

        {data.diagnosis && (
          <div className="mt-5 rounded-xl bg-muted p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Stethoscope className="h-4 w-4 text-primary-700" /> Diagnóstico
            </p>
            <p className="mt-1 text-muted-foreground">{data.diagnosis}</p>
          </div>
        )}

        {data.description && (
          <p className="mt-5 whitespace-pre-line text-muted-foreground">{data.description}</p>
        )}

        {data.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <TagIcon className="h-4 w-4 text-muted-foreground" />
            {data.tags.map(({ tag }) => (
              <Link key={tag.id} to={`/catalogo?tag=${tag.slug}`}>
                <Badge variant="outline" className="hover:bg-muted">#{tag.name}</Badge>
              </Link>
            ))}
          </div>
        )}

        {data.audioUrl && (
          <div className="mt-5 rounded-xl border border-border bg-muted p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <AudioLines className="h-4 w-4 text-primary-700" /> Áudio do caso
            </p>
            {data.audioTitle && (
              <p className="mt-1 text-muted-foreground">{data.audioTitle}</p>
            )}
            <audio controls src={resolveImageUrl(data.audioUrl)} className="mt-3 h-10 w-full" preload="metadata" />
            {data.audioTags && data.audioTags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {data.audioTags.map(({ tag }) => (
                  <span
                    key={tag.id}
                    className="rounded-full bg-accent-50 px-2.5 py-0.5 text-xs font-medium text-accent-700"
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {isAuthenticated && (data.isFree || hasPremiumAccess(user)) && (
        <StudySection caseStudyId={data.id} caseTitle={data.title} />
      )}

      {data.videoCases.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-5 text-xl font-bold text-foreground">Vídeos deste caso</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {data.videoCases.map(({ video }) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}

      {data.images && data.images.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-foreground">
            <ImagesIcon className="h-5 w-5 text-primary-700" /> Imagens deste caso
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {data.images.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setLightbox(img.url)}
                className="group overflow-hidden rounded-xl border border-border bg-surface text-left"
                title="Ampliar imagem"
              >
                <img
                  src={resolveImageUrl(img.url)}
                  alt={img.alt ?? data.title}
                  className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                />
                {img.tags && img.tags.length > 0 && (
                  <span className="flex flex-wrap gap-1 p-2">
                    {img.tags.map(({ tag }) => (
                      <span
                        key={tag.id}
                        className="rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-medium text-accent-700"
                      >
                        #{tag.name}
                      </span>
                    ))}
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {data.relatedCases.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-bold text-foreground">Casos relacionados</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {data.relatedCases.map(({ related }) => (
              <Link
                key={related.id}
                to={`/casos/${related.slug}`}
                className="group flex items-center justify-between rounded-xl border border-border bg-surface p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div>
                  <p className="font-medium text-foreground group-hover:text-primary-800">
                    {related.title}
                  </p>
                  <p className="text-xs capitalize text-muted-foreground">{related.difficulty.toLowerCase()}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            onClick={() => setLightbox(null)}
            aria-label="Fechar imagem"
          >
            <X className="h-6 w-6" />
          </button>
          <img src={resolveImageUrl(lightbox)} alt="" className="max-h-full max-w-full rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
}
