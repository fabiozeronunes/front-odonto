import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowRight, Sparkles, ShieldCheck, GraduationCap, Play, Plus } from "lucide-react";
import { api } from "../lib/api";
import type { Paginated, Specialty, Video, CaseStudy } from "../types";
import { VideoCard } from "../components/VideoCard";
import { SpecialtyCard } from "../components/SpecialtyCard";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";

function ToothIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.5c-2.6 0-4.6 1.4-5.6 3.6-.8 1.8-.7 3.8.5 5.3 1 1.2 1.5 2.8 1.7 4.5.2 1.6.9 4.1 2.2 4.1 1.5 0 1.1-2.5 2.2-2.5 1.1 0 .7 2.5 2.2 2.5 1.3 0 2-2.5 2.2-4.1.2-1.7.7-3.3 1.7-4.5 1.2-1.5 1.3-3.5.5-5.3C16.6 3.9 14.6 2.5 12 2.5z" />
    </svg>
  );
}

const heroStats = [
  { value: "+40", label: "vídeos de estudo" },
  { value: "14", label: "especialidades" },
  { value: "100%", label: "online e gratuito" },
];

export function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      api<Paginated<Video>>("/api/videos?perPage=6&sort=popular"),
      api<{ data: Specialty[] }>("/api/specialties"),
      api<Paginated<CaseStudy>>("/api/case-studies?perPage=3"),
    ])
      .then(([v, s, c]) => {
        setVideos(v.data);
        setSpecialties(s.data);
        setCaseStudies(c.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-800 to-teal-700 text-white animate-gradient-x">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-accent-400/20 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div className="relative">
            <Badge className="animate-fade-in-up bg-white/15 text-white hover:bg-white/20">
              <Sparkles className="h-3 w-3" /> Plataforma de estudos odontológicos
            </Badge>

            <h1 className="mt-5 animate-fade-in-up anim-delay-100 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Domine a <span className="relative inline-block">
                Odontologia
                <span className="absolute inset-x-0 -bottom-1 h-1.5 rounded-full bg-gradient-to-r from-teal-300 to-accent-400" />
              </span>{" "}
              com aulas em vídeo
            </h1>

            <p className="mt-5 max-w-xl animate-fade-in-up anim-delay-200 text-lg text-primary-100">
              Aprenda por especialidade, acompanhe estudos de caso reais e evolua seus estudos com
              conteúdos gratuitos e premium feitos para a sua formação.
            </p>

            <form
              className="mt-8 flex max-w-lg animate-fade-in-up anim-delay-300 gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                window.location.href = `/catalogo?search=${encodeURIComponent(search)}`;
              }}
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar vídeos, especialidades, tags..."
                  className="h-12 bg-white pl-10 text-slate-900"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 bg-white text-primary-800 hover:bg-slate-100">
                Buscar
              </Button>
            </form>

            <div className="mt-8 flex flex-wrap gap-3 animate-fade-in-up anim-delay-400">
              <Link to="/catalogo">
                <Button size="lg" variant="premium" className="h-12">
                  Explorar catálogo <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/casos">
                <Button size="lg" className="h-12 bg-white/10 text-white backdrop-blur hover:bg-white/20">
                  <GraduationCap className="h-5 w-5" /> Estudos de caso
                </Button>
              </Link>
            </div>

            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4 animate-fade-in-up anim-delay-500">
              {heroStats.map((s) => (
                <div key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="text-2xl font-extrabold text-teal-200">{s.value}</dd>
                  <dd className="text-sm text-primary-200">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative hidden lg:block">
            <div className="animate-float-slow">
              <div className="relative mx-auto flex aspect-square w-full max-w-md items-center justify-center rounded-[2.5rem] border border-white/20 bg-white/10 p-10 backdrop-blur-xl shadow-lift">
                <div className="absolute inset-6 rounded-[2rem] border border-dashed border-white/25" />

                <ToothIcon className="absolute -left-6 -top-6 h-20 w-20 text-teal-300/60 animate-float" />

                <div className="relative z-10 text-center">
                  <div className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-accent-500 shadow-2xl">
                    <span className="absolute inset-0 rounded-full bg-teal-400 animate-pulse-ring" />
                    <Play className="relative h-12 w-12 text-white" fill="currentColor" />
                  </div>
                  <p className="mt-6 text-sm font-medium text-primary-100">Aulas direto ao ponto</p>
                  <p className="mt-1 text-xs text-primary-200">por especialidade e caso clínico</p>
                </div>

                <span className="absolute right-8 top-8 text-teal-300 animate-float anim-delay-200">
                  <Plus className="h-6 w-6" />
                </span>
                <span className="absolute bottom-10 left-4 text-teal-200/70 animate-float anim-delay-300">
                  <Plus className="h-4 w-4" />
                </span>
              </div>
            </div>

            <div className="absolute -right-4 top-6 animate-float anim-delay-300 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles className="h-4 w-4 text-teal-300" /> Endodontia
              </p>
            </div>
            <div className="absolute -left-6 bottom-16 animate-float anim-delay-100 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="flex items-center gap-2 text-sm font-semibold text-white">
                <GraduationCap className="h-4 w-4 text-accent-300" /> Estudos de caso
              </p>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 opacity-[0.06]">
          <ToothIcon className="absolute right-[12%] top-[18%] h-24 w-24 text-white animate-spin-slow" />
          <ToothIcon className="absolute bottom-[12%] left-[8%] h-16 w-16 text-white animate-float" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Vídeos em destaque</h2>
            <p className="text-slate-500">Os conteúdos mais assistidos da plataforma</p>
          </div>
          <Link to="/catalogo" className="flex items-center text-sm font-medium text-primary-700 hover:text-primary-800">
            Ver todos <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-video animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Especialidades</h2>
              <p className="text-slate-500">Explore conteúdos por área de atuação</p>
            </div>
            <Link to="/especialidades" className="flex items-center text-sm font-medium text-primary-700 hover:text-primary-800">
              Todas as especialidades <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {specialties.slice(0, 8).map((specialty) => (
              <SpecialtyCard key={specialty.id} specialty={specialty} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Estudos de caso</h2>
            <p className="text-slate-500">Casos clínicos comentados passo a passo</p>
          </div>
          <Link to="/casos" className="flex items-center text-sm font-medium text-primary-700 hover:text-primary-800">
            Ver todos <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {caseStudies.map((cs) => (
              <Link
                key={cs.id}
                to={`/casos/${cs.slug}`}
                className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-shadow hover:shadow-lift"
              >
                <div className="flex items-center justify-between">
                  <Badge variant={cs.isFree ? "free" : "premium"}>
                    {cs.isFree ? "GRATUITO" : "PREMIUM"}
                  </Badge>
                  <span className="text-xs capitalize text-slate-400">{cs.difficulty.toLowerCase()}</span>
                </div>
                <h3 className="mt-3 font-semibold text-slate-900 group-hover:text-primary-800">
                  {cs.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{cs.description}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="bg-gradient-to-br from-teal-700 to-primary-800 py-14 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 text-center sm:px-6 md:flex-row md:justify-between md:text-left">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Acesse todo o conteúdo premium</h2>
            <p className="mt-2 text-primary-100">
              Estudos de caso exclusivos, vídeos avançados e benefícios especiais.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/planos">
              <Button size="lg" variant="premium" className="h-12">
                Conhecer planos <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/cadastro">
              <Button size="lg" className="h-12 bg-white text-primary-800 hover:bg-slate-100">
                Criar conta gratuita
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-card">
            <GraduationCap className="mx-auto h-8 w-8 text-primary-700" />
            <h3 className="mt-3 font-semibold text-slate-900">Conteúdo estruturado</h3>
            <p className="mt-1 text-sm text-slate-500">
              Organizado por especialidade, nível e estudo de caso.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-card">
            <Search className="mx-auto h-8 w-8 text-primary-700" />
            <h3 className="mt-3 font-semibold text-slate-900">Busca inteligente</h3>
            <p className="mt-1 text-sm text-slate-500">
              Encontre vídeos por título, tag, especialidade e autor.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-card">
            <ShieldCheck className="mx-auto h-8 w-8 text-primary-700" />
            <h3 className="mt-3 font-semibold text-slate-900">Ambiente seguro</h3>
            <p className="mt-1 text-sm text-slate-500">
              Dados protegidos em conformidade com a LGPD.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
