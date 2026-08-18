import { useCallback, useEffect, useMemo, useState } from "react";
import { Sparkles, PlayCircle } from "lucide-react";
import { Plans } from "./Plans";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { HeroVideoPlayer } from "../components/HeroVideoPlayer";
import { RecursosSection } from "../components/RecursosSection";
import { TestimonialsSection } from "../components/TestimonialsSection";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useHomeLock } from "../lib/homeLock";
import { cn } from "../lib/utils";

const GRADIENT_CLASS = "bg-gradient-to-r from-teal-500 to-amber-500 bg-clip-text text-transparent";

const HOME_UNLOCK_KEY = "odonto_home_unlocked";

function isHomeUnlocked(): boolean {
  try {
    return sessionStorage.getItem(HOME_UNLOCK_KEY) === "1";
  } catch {
    return false;
  }
}

function smoothScrollToPlanos() {
  const target = document.getElementById("planos");
  if (!target) return;
  const startY = window.scrollY;
  const targetY = target.getBoundingClientRect().top + window.scrollY - 64;
  const distance = targetY - startY;
  if (Math.abs(distance) < 1) return;
  const duration = Math.min(Math.max(Math.abs(distance) * 0.45, 700), 1400);
  const start = performance.now();
  const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const step = (now: number) => {
    const progress = Math.min((now - start) / duration, 1);
    window.scrollTo(0, startY + distance * ease(progress));
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

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
  const [videoStarted, setVideoStarted] = useState(false);
  const [smartProgressBoost, setSmartProgressBoost] = useState(1.2);

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
        const alreadyUnlocked = isHomeUnlocked();
        setLocked(!!res.data?.enabled && !isAuthenticated && !!heroVideo && !alreadyUnlocked);
        setLockChecked(true);
      })
      .catch(() => {
        if (!active) return;
        setLocked(false);
        setLockChecked(true);
      });
    api<{ data: { boost: number } }>("/api/settings/hero-smart-progress", { skipAuth: true })
      .then((res) => {
        if (active) setSmartProgressBoost(Number(res.data?.boost) || 1.2);
      })
      .catch(() => {
        if (active) setSmartProgressBoost(1.2);
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated, heroVideo]);

  const lockActive = lockEnabled && !isAuthenticated && !!heroVideo;

  const unlockHome = useCallback(() => {
    try {
      sessionStorage.setItem(HOME_UNLOCK_KEY, "1");
    } catch {
      /* ignore */
    }
    setLocked(false);
  }, []);

  useEffect(() => {
    if (!locked) return;
    if (!unlockMinutes) return;
    if (!videoStarted) return;
    const timer = setTimeout(unlockHome, unlockMinutes * 60_000);
    return () => clearTimeout(timer);
  }, [locked, unlockMinutes, videoStarted, unlockHome]);

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
            <Badge className="animate-fade-in-up rounded-full border border-teal-300/60 bg-white px-4 py-1.5 text-sm font-semibold text-teal-700 hover:bg-white dark:border-primary-700 dark:bg-primary-900/40 dark:text-teal-300 dark:hover:bg-primary-900/40">
              <Sparkles className="h-3 w-3" /> Plataforma de estudos odontológicos
            </Badge>

            <h1 className="mx-auto mt-5 max-w-4xl font-display text-2xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl animate-fade-in-up anim-delay-100">
              {heroTitle ? (
                renderGradientText(heroTitle)
              ) : (
                <>
                  Domine a{" "}
                  <span className="bg-gradient-to-r from-teal-500 to-amber-500 bg-clip-text text-transparent">
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
                    smartProgressBoost={smartProgressBoost}
                    onStart={() => setVideoStarted(true)}
                    onEnded={() => {
                      if (!unlockMinutes) unlockHome();
                    }}
                  />
                ) : (
                  <HeroVideoPlayer videoUrl={heroVideo} smartProgressBoost={smartProgressBoost} onStart={() => setVideoStarted(true)} />
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

            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-white/75 animate-fade-in-up anim-delay-200 sm:text-xl">
              {heroSubtitle
                ? renderGradientText(heroSubtitle)
                : "Aprenda por especialidades, estude casos reais e evolua com Quizz, Flashcards e Questionários que vão ajudar na sua formação e aprendizado."}
            </p>

            {!contentHidden && (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center animate-fade-in-up anim-delay-200">
                <a
                  href="#planos"
                  onClick={(e) => {
                    e.preventDefault();
                    smoothScrollToPlanos();
                  }}
                >
                  <Button
                    size="lg"
                    variant="premium"
                    className="h-12 w-full rounded-full px-8 font-semibold shadow-glow sm:w-auto"
                  >
                    <Sparkles className="h-5 w-5" /> Escolher meu plano
                  </Button>
                </a>
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
          {/* ===== RECURSOS (BENEFÍCIOS) ===== */}
          <RecursosSection />

          {/* ===== DEPOIMENTOS ===== */}
          <TestimonialsSection />

          {/* ===== PLANS SECTION ===== */}
          <section id="planos" className="scroll-mt-16">
            <Plans />
          </section>
        </div>
      )}
    </div>
  );
}