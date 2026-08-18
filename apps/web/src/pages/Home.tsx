import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, PlayCircle } from "lucide-react";
import { Plans } from "./Plans";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { HeroVideoPlayer } from "../components/HeroVideoPlayer";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useHomeLock } from "../lib/homeLock";
import { cn } from "../lib/utils";

const GRADIENT_CLASS = "bg-gradient-to-r from-teal-300 to-amber-400 bg-clip-text text-transparent";

function renderGradientText(text: string) {
  return text.split(/(\*[^*]+\*)/g).map((part, i) =>
    part.startsWith("*") && part.endsWith("*") ? (
      <span key={i} className={GRADIENT_CLASS}>
        {part.slice(1, -1)}
      </span>
    ) : (
      part
    )
  );
}

export function Home() {
  const { isAuthenticated } = useAuth();
  const [heroVideo, setHeroVideo] = useState<string | null>(null);
  const [heroTitle, setHeroTitle] = useState<string | null>(null);
  const [heroSubtitle, setHeroSubtitle] = useState<string | null>(null);
  const [lockEnabled, setLockEnabled] = useState(false);
  const [unlockMinutes, setUnlockMinutes] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockChecked, setLockChecked] = useState(false);

  useEffect(() => {
    let active = true;
    api<{ data: string | null }>("/api/settings/hero-video", { skipAuth: true })
      .then((res) => {
        if (active) setHeroVideo(res.data ?? null);
      })
      .catch(() => {
        if (active) setHeroVideo(null);
      });
    api<{ data: { title: string; subtitle: string } }>("/api/settings/hero-content", { skipAuth: true })
      .then((res) => {
        if (!active) return;
        setHeroTitle(res.data?.title ?? null);
        setHeroSubtitle(res.data?.subtitle ?? null);
      })
      .catch(() => {
        if (!active) return;
        setHeroTitle(null);
        setHeroSubtitle(null);
      });
    api<{ data: { enabled: boolean; unlockMinutes: number } }>("/api/settings/home-lock", {
      skipAuth: true,
    })
      .then((res) => {
        if (!active) return;
        setLockEnabled(!!res.data?.enabled);
        setUnlockMinutes(Number(res.data?.unlockMinutes) || 0);
        setLocked(!!res.data?.enabled && !isAuthenticated && !!heroVideo);
        setLockChecked(true);
      })
      .catch(() => {
        if (!active) return;
        setLocked(false);
        setLockChecked(true);
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated, heroVideo]);

  const lockActive = lockEnabled && !isAuthenticated && !!heroVideo;

  useEffect(() => {
    if (!locked) return;
    if (!unlockMinutes) return;
    const timer = setTimeout(() => {
      setLocked(false);
    }, unlockMinutes * 60_000);
    return () => clearTimeout(timer);
  }, [locked, unlockMinutes]);

  const contentHidden = useMemo(
    () => (lockChecked ? lockActive && locked : true),    [lockChecked, lockActive, locked]
  );

  const { setContentHidden } = useHomeLock();

  useEffect(() => {
    setContentHidden(contentHidden);
    return () => setContentHidden(false);
  }, [contentHidden, setContentHidden]);

  return (
    <div className={cn("flex flex-col", contentHidden ? "flex-1 bg-primary-950" : "min-h-screen bg-background")}>
      {/* ===== FIRST FOLD: HERO ===== */}
      <section
        className={cn(
          "relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-800 to-teal-700 text-white",
          contentHidden && "flex flex-col"
        )}
      >
        {!contentHidden && (
          <>
            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl" />
            <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
          </>
        )}

        <div
          className={cn(
            "mx-auto w-full max-w-5xl px-4 sm:px-6",
            contentHidden ? "flex flex-col py-6 sm:py-8" : "py-16 lg:py-24"
          )}
        >
          <div className="text-center">
            <Badge className="animate-fade-in-up rounded-full border border-teal-400/40 bg-primary-900/60 px-4 py-1.5 text-teal-200 hover:bg-primary-900/60">
              <Sparkles className="h-3 w-3" /> Plataforma de estudos odontológicos
            </Badge>

            <h1 className="mx-auto mt-5 max-w-4xl font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl animate-fade-in-up anim-delay-100">
              {heroTitle ? (
                renderGradientText(heroTitle)
              ) : (
                <>
                  Domine a{" "}
                  <span className="bg-gradient-to-r from-teal-300 to-amber-400 bg-clip-text text-transparent">
                    Odontologia
                  </span>{" "}
                  Estudando por Vídeos, Imagens e Estudos de Casos.
                </>
              )}
            </h1>

            {/* Bloco de vídeo da hero (configurável no admin) */}
            <div className="relative mx-auto mt-8 max-w-3xl animate-fade-in-up anim-delay-200">
              {heroVideo ? (
                lockActive && locked ? (
                  <HeroVideoPlayer
                    videoUrl={heroVideo}
                    onEnded={() => {
                      if (!unlockMinutes) setLocked(false);
                    }}
                  />
                ) : (
                  <HeroVideoPlayer videoUrl={heroVideo} />
                )
              ) : (
                <div className="overflow-hidden rounded-3xl border border-teal-400/30 bg-primary-950/60 shadow-lift backdrop-blur">
                  <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800">
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600 shadow-glow animate-pulse-ring">
                      <PlayCircle className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-white/80 animate-fade-in-up anim-delay-200">
              {heroSubtitle
                ? renderGradientText(heroSubtitle)
                : "Aprenda por especialidades, estude casos reais e evolua com Quizz, Flashcards e Questionários que vão ajudar na sua formação e aprendizado."}
            </p>

            {!contentHidden && (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center animate-fade-in-up anim-delay-200">
                <Link to="/cadastro">
                  <Button
                    size="lg"
                    variant="premium"
                    className="h-12 w-full px-8 font-semibold shadow-glow sm:w-auto"
                  >
                    <PlayCircle className="h-5 w-5" /> Começar a estudar grátis
                  </Button>
                </Link>
                <a
                  href="#planos"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("planos")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 w-full border-2 border-white/25 bg-white/10 px-8 font-semibold text-white hover:bg-white/20 hover:text-white sm:w-auto"
                  >
                    Ver planos
                  </Button>
                </a>
              </div>
            )}

            {!contentHidden && (
              <div className="mt-10 flex flex-wrap justify-center gap-10 border-t border-teal-400/25 pt-6 animate-fade-in-up anim-delay-300">
                <div>
                  <p className="font-display text-2xl font-bold sm:text-3xl">+300</p>
                  <p className="text-sm text-teal-200">vídeos</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-bold sm:text-3xl">+2.000</p>
                  <p className="text-sm text-teal-200">alunos ativos</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-bold sm:text-3xl">4.9★</p>
                  <p className="text-sm text-teal-200">avaliação média</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {!contentHidden && (
          <div className="pointer-events-none absolute -right-6 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-teal-400/10 blur-3xl animate-float-slow" />
        )}
      </section>

      {!contentHidden && (
        <div className="animate-fade-in-up anim-delay-100">
          {/* ===== PLANS SECTION ===== */}
          <section id="planos" className="scroll-mt-16 bg-background py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <Plans />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}