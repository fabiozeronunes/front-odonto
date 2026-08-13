import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Stethoscope, User, Building2, Tag as TagIcon, ArrowRight } from "lucide-react";
import { api, ApiRequestError } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { CaseStudy, Video } from "../types";
import { VideoCard } from "../components/VideoCard";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

interface CaseStudyDetail extends CaseStudy {
  videoCases: { video: Video }[];
  relatedCases: { related: { id: string; title: string; slug: string; isFree: boolean; difficulty: string } }[];
}

export function CaseStudyDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<CaseStudyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <div className="h-8 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="mt-6 h-64 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Erro</h1>
        <p className="mt-2 text-slate-500">{error}</p>
        <Link to="/casos" className="mt-4 inline-block">
          <Button variant="outline">Voltar aos casos</Button>
        </Link>
      </div>
    );
  }

  if (!data.isFree && !isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <Badge variant="premium" className="mb-4">CONTEÚDO PREMIUM</Badge>
        <h1 className="text-2xl font-bold text-slate-900">{data.title}</h1>
        <p className="mt-2 text-slate-600">
          Este estudo de caso é exclusivo para membros premium.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/planos">
            <Button variant="premium">Assinar Premium</Button>
          </Link>
          <Button variant="outline" onClick={() => navigate("/login")}>
            Fazer login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link to="/casos" className="text-sm font-medium text-primary-700 hover:text-primary-800">
        ← Voltar aos estudos de caso
      </Link>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={data.isFree ? "free" : "premium"}>
            {data.isFree ? "GRATUITO" : "PREMIUM"}
          </Badge>
          <Badge variant="info" className="capitalize">{data.difficulty.toLowerCase()}</Badge>
          {data.specialty && <Badge variant="outline">{data.specialty.name}</Badge>}
        </div>

        <h1 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">{data.title}</h1>

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
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
          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Stethoscope className="h-4 w-4 text-primary-700" /> Diagnóstico
            </p>
            <p className="mt-1 text-slate-600">{data.diagnosis}</p>
          </div>
        )}

        {data.description && (
          <p className="mt-5 whitespace-pre-line text-slate-600">{data.description}</p>
        )}

        {data.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <TagIcon className="h-4 w-4 text-slate-400" />
            {data.tags.map(({ tag }) => (
              <Link key={tag.id} to={`/catalogo?tag=${tag.slug}`}>
                <Badge variant="outline" className="hover:bg-slate-100">#{tag.name}</Badge>
              </Link>
            ))}
          </div>
        )}
      </div>

      {data.videoCases.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-5 text-xl font-bold text-slate-900">Vídeos deste caso</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {data.videoCases.map(({ video }) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}

      {data.relatedCases.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-bold text-slate-900">Casos relacionados</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {data.relatedCases.map(({ related }) => (
              <Link
                key={related.id}
                to={`/casos/${related.slug}`}
                className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-card transition-shadow hover:shadow-lift"
              >
                <div>
                  <p className="font-medium text-slate-900 group-hover:text-primary-800">
                    {related.title}
                  </p>
                  <p className="text-xs capitalize text-slate-400">{related.difficulty.toLowerCase()}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
