import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, GraduationCap, Play, Plus, Search, ShieldCheck } from "lucide-react";
import { api } from "../lib/api";
import type {
  Paginated,
  Specialty,
  Video,
  CaseStudy,
  MembershipPlan,
} from "../types";
import { VideoCard } from "../components/VideoCard";
import { SpecialtyCard } from "../components/SpecialtyCard";
import { Plans } from "./Plans";
import { Footer } from "../components/Footer";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

function ToothIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
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
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      api<Paginated<Video>>("/api/videos?perPage=6&sort=popular"),
      api<{ data: Specialty[] }>("/api/specialties"),
      api<Paginated<CaseStudy>>("/api/case-studies?perPage=3"),
      api<{ data: MembershipPlan[] }>("/api/plans"),
    ])
      .then(([v, s, c, p]) => {
        setVideos(v.data);
        setSpecialties(s.data);
        setCaseStudies(c.data);
        setPlans(p.data);
      })
      .finally(() => setLoading(false));
  }, []);

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
              Domine a <span className="relative inline-block">
                <span className="absolute inset-x-0 -bottom-1 h-1.5 rounded-full bg-gradient-to-r from-teal-300 to-accent-400" />
                Odontologia
              </span>
              com aulas em vídeo
            </h1>

            <p className="mt-5 max-w-xl text-lg text-white/80 leading-relaxed">
              Aprenda por especialidade, acompanhe estudos de caso reais e evolua seus estudos com
              conteúdos gratuitos e premium feitos para a sua formação.
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
                  className="h-12 px-8 font-medium text-white border-2 border-white/20 hover:bg-white/10 transition-colors"
                >
                  Acesso Gratuito
                </Button>
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4 animate-fade-in">
              {heroStats.map((s) => (
                <div key={s.label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blurxl border border-white/20">
                  <Sparkles className="h-4 w-4 text-teal-300" />
                  <span className="text-sm text-white/60">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl animate-float-slow" />
      </section>

      {/* ===== PLANS SECTION (first fold) ===== */}
      <section className="py-12 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Plans />
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <Footer />

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
