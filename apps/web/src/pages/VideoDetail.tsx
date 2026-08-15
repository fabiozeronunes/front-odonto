import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { Heart, Eye, Clock, User, Building2, Calendar, Images as ImagesIcon, Tag as TagIcon, X } from "lucide-react";
import { api, ApiRequestError } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { VideoDetail } from "../types";
import { VideoCard } from "../components/VideoCard";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { formatDate, formatDuration, resolveImageUrl } from "../lib/utils";

function hasPremiumAccess(user: { role?: string; plan?: { slug: string } } | null) {
  return user?.role === "ADMIN" || (!!user?.plan && user.plan.slug !== "gratuito");
}

export function VideoDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromCaseStudies = (location.state as { fromCaseStudies?: boolean } | null)?.fromCaseStudies === true;
  const [data, setData] = useState<VideoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPremiumLocked, setIsPremiumLocked] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api<VideoDetail>(`/api/videos/${slug}`)
      .then((d) => {
        setData(d);
        if (!d.video.isFree && !hasPremiumAccess(user)) {
          setIsPremiumLocked(true);
        }
      })
      .catch((e) => setError(e instanceof ApiRequestError ? e.message : "Erro ao carregar vídeo"))
      .finally(() => setLoading(false));
  }, [slug, isAuthenticated, user]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="aspect-video animate-pulse rounded-2xl bg-muted" />
        <div className="mt-6 h-8 w-2/3 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-foreground">Erro</h1>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Link to={fromCaseStudies ? "/casos" : "/catalogo"} className="inline-block">
            <Button variant="outline">
              {fromCaseStudies ? "Voltar aos estudos de casos" : "Voltar ao catálogo"}
            </Button>
          </Link>
          {fromCaseStudies && (
            <Link to="/catalogo" className="inline-block">
              <Button variant="ghost">Ver catálogo</Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  const { video, related } = data;

  async function toggleFavorite() {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/video/${video.slug}` } });
      return;
    }
    const result = await api<{ favorited: boolean }>(`/api/videos/${video.id}/favorite`, {
      method: "POST",
    });
    setFavorited(result.favorited);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-4">
        <Link to="/catalogo" className="text-sm font-medium text-primary-700 hover:text-primary-800">
          ← Voltar ao catálogo
        </Link>
      </div>

      {isPremiumLocked ? (
        <div className="flex flex-col items-center rounded-2xl border border-amber-200 bg-amber-50 px-6 py-20 text-center dark:border-amber-900/60 dark:bg-amber-950/40">
          <Badge variant="premium" className="mb-4">CONTEÚDO PREMIUM</Badge>
          <h1 className="text-2xl font-bold text-foreground">{video.title}</h1>
          <p className="mt-2 max-w-md text-muted-foreground">
            {isAuthenticated
              ? "Você não tem permissão para assistir este conteúdo. Assine o plano Premium para desbloquear todos os vídeos exclusivos."
              : "Este vídeo é exclusivo para membros premium. Faça login ou assine o plano Premium para desbloquear."}
          </p>
          <div className="mt-6 flex gap-3">
            {isAuthenticated ? (
              <Link to="/planos">
                <Button variant="premium">Assinar Premium</Button>
              </Link>
            ) : (
              <>
                <Link to="/planos">
                  <Button variant="premium">Assinar Premium</Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline">Fazer login</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          <div className="aspect-video bg-black">
            <iframe
              src={video.videoUrl}
              title={video.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              {video.isFree ? (
                <Badge variant="free">GRATUITO</Badge>
              ) : (
                <Badge variant="premium">PREMIUM</Badge>
              )}
              <Badge variant="info" className="capitalize">
                {video.difficulty.toLowerCase()}
              </Badge>
              {video.specialty && (
                <Link to={`/catalogo?specialty=${video.specialty.slug}`}>
                  <Badge variant="outline" className="hover:bg-muted">
                    {video.specialty.name}
                  </Badge>
                </Link>
              )}
            </div>

            <h1 className="mt-3 font-display text-2xl font-bold text-foreground sm:text-3xl">{video.title}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {video.durationSeconds ? (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> {formatDuration(video.durationSeconds)}
                </span>
              ) : null}
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" /> {video.viewCount} visualizações
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> {formatDate(video.publishedAt)}
              </span>
              {video.author && (
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" /> {video.author}
                </span>
              )}
              {video.institution && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" /> {video.institution}
                </span>
              )}
            </div>

            {video.description && (
              <p className="mt-5 whitespace-pre-line text-muted-foreground">{video.description}</p>
            )}

            {video.images && video.images.length > 0 && (
              <div className="mt-6">
                <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                  <ImagesIcon className="h-5 w-5 text-primary-700" /> Imagens relacionadas ao assunto
                </h2>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {video.images.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setLightbox(img.url)}
                      className="group overflow-hidden rounded-xl border border-border text-left"
                      title="Ampliar imagem"
                    >
                      <img
                        src={resolveImageUrl(img.url)}
                        alt={img.alt ?? video.title}
                        className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                      />
                      {img.tags && img.tags.length > 0 && (
                        <span className="flex flex-wrap gap-1 p-2">
                          {img.tags.map(({ tag }) => (
                            <span
                              key={tag.id}
                              className="rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-medium text-accent-700 dark:bg-accent-900 dark:text-accent-200"
                            >
                              #{tag.name}
                            </span>
                          ))}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {video.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <TagIcon className="h-4 w-4 text-muted-foreground" />
                {video.tags.map(({ tag }) => (
                  <Link key={tag.id} to={`/catalogo?tag=${tag.slug}`}>
                    <Badge variant="outline" className="hover:bg-muted">
                      #{tag.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-6 flex gap-3 border-t border-border pt-5">
              <Button variant="outline" onClick={toggleFavorite}>
                <Heart className={favorited ? "fill-red-500 text-red-500" : ""} />
                {favorited ? "Favoritado" : "Favoritar"}
              </Button>
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  onClick={async () => {
                    await api(`/api/videos/${video.id}/watch`, { method: "POST" });
                  }}
                >
                  Registrar visualização
                </Button>
              )}
            </div>
          </div>
        </div>
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

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-xl font-bold text-foreground">Vídeos relacionados</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <VideoCard key={item.id} video={item} />
            ))}
          </div>
        </section>
      )}

      {data.relatedImages && data.relatedImages.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-xl font-bold text-foreground">Imagens relacionadas</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {data.relatedImages.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setLightbox(img.url)}
                className="group overflow-hidden rounded-xl border border-border text-left"
                title="Ampliar imagem"
              >
                <img
                  src={resolveImageUrl(img.url)}
                  alt={img.alt ?? video.title}
                  className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                />
                <span className="flex flex-wrap gap-1 p-2">
                  {img.tags.map(({ tag }) => (
                    <span
                      key={tag.id}
                      className="rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-medium text-accent-700 dark:bg-accent-900 dark:text-accent-200"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {data.relatedCaseStudies && data.relatedCaseStudies.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-xl font-bold text-foreground">Estudos de caso relacionados</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {data.relatedCaseStudies.map((cs) => (
              <Link
                key={cs.id}
                to={`/casos/${cs.slug}`}
className="group flex items-center justify-between rounded-xl border border-border bg-surface p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <div>
                    <p className="font-medium text-foreground group-hover:text-primary-800 dark:group-hover:text-primary-300">{cs.title}</p>
                    <p className="text-xs capitalize text-muted-foreground">{cs.difficulty.toLowerCase()}</p>
                </div>
                <Badge variant={cs.isFree ? "free" : "premium"}>
                  {cs.isFree ? "GRATUITO" : "PREMIUM"}
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
