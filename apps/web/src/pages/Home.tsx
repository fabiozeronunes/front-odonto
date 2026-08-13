import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Plans } from "./Plans";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

const heroStats = [
  { value: "+40", label: "vídeos de estudo" },
  { value: "14", label: "especialidades" },
  { value: "100%", label: "online e gratuito" },
];

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

      {/* ===== PLANS SECTION ===== */}
      <section className="py-12 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Plans />
        </div>
      </section>
    </div>
  );
}
