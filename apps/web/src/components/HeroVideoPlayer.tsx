import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Volume2, VolumeX, Gauge, Sparkles } from "lucide-react";

const YOUTUBE_ID_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/;

function getVideoId(url: string): string | null {
  const match = url.match(YOUTUBE_ID_REGEX) ?? url.match(/^([\w-]{11})$/);
  return match ? match[1] : null;
}

export interface YTPlayerLike {
  playVideo(): void;
  pauseVideo(): void;
  getCurrentTime(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getPlayerState(): number;
  getDuration(): number;
  setPlaybackRate(rate: number): void;
  getPlaybackRate(): number;
  isMuted(): boolean;
  mute(): void;
  unMute(): void;
}

type Props = {
  videoUrl: string;
  onEnded?: () => void;
  onStart?: () => void;
};

const TURBO_SPEEDS = [1, 1.25, 1.5, 1.75, 2] as const;

const SMART_PROGRESS_BOOST = 1.2;

export function HeroVideoPlayer({ videoUrl, onEnded, onStart }: Props) {
  const videoId = getVideoId(videoUrl);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayerLike | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [started, setStarted] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [smartProgress, setSmartProgress] = useState(0);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const onStartRef = useRef(onStart);
  onStartRef.current = onStart;

  const createPlayer = useCallback(() => {
    if (!window.YT || !window.YT.Player || !containerRef.current || !videoId) return;
    new window.YT.Player(containerRef.current, {
      videoId,
      playerVars: {
        autoplay: 0,
        mute: 1,
        controls: 0,
        disablekb: 1,
        rel: 0,
        modestbranding: 1,
        fs: 0,
        playsinline: 1,
        iv_load_policy: 3,
      },
      events: {
        onReady: (e: { target: YTPlayerLike }) => {
          playerRef.current = e.target;
          setReady(true);
          setMuted(e.target.isMuted());
          setPlaying(e.target.getPlayerState() === 1);
        },
        onStateChange: (e: { data: number }) => {
          setPlaying(e.data === 1);
          if (e.data === 0) onEndedRef.current?.();
        },
      },
    });
  }, [videoId]);

  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    const boot = () => {
      if (!cancelled) createPlayer();
    };
    if (window.YT?.Player) {
      boot();
    } else {
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = boot;
    }
    return () => {
      cancelled = true;
    };
  }, [videoId, createPlayer]);

  useEffect(() => {
    if (!videoId) return;
    const interval = setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      const current = player.getCurrentTime();
      const state = player.getPlayerState();
      const duration = player.getDuration();
      if (duration) {
        const real = Math.min(1, Math.max(0, current / duration));
        setSmartProgress(Math.min(1, real * SMART_PROGRESS_BOOST));
      }
      if (lastTimeRef.current === null) {
        lastTimeRef.current = current;
        return;
      }
      const delta = current - lastTimeRef.current;
      if (state === 1 && delta > 1.5) {
        player.seekTo(lastTimeRef.current, true);
      } else {
        lastTimeRef.current = current;
      }
    }, 400);
    return () => clearInterval(interval);
  }, [videoId]);

  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (player.getPlayerState() === 1) {
      player.pauseVideo();
      setPlaying(false);
    } else {
      player.playVideo();
      setPlaying(true);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (player.isMuted()) {
      player.unMute();
      setMuted(false);
    } else {
      player.mute();
      setMuted(true);
    }
  }, []);

  const startWithSound = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    player.unMute();
    setMuted(false);
    setStarted(true);
    player.playVideo();
    setPlaying(true);
    onStartRef.current?.();
  }, []);

  const cycleSpeed = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    const next = TURBO_SPEEDS[(TURBO_SPEEDS.indexOf(speed as (typeof TURBO_SPEEDS)[number]) + 1) % TURBO_SPEEDS.length] ?? 1;
    player.setPlaybackRate(next);
    setSpeed(next);
  }, [speed]);

  if (!videoId) {
    return (
      <div className="flex aspect-video w-full items-center justify-center bg-black text-sm text-white/60">
        Vídeo inválido
      </div>
    );
  }

  return (
    <div className="group relative aspect-video w-full overflow-hidden rounded-3xl border border-teal-400/30 bg-black shadow-lift">
      <div ref={containerRef} className="h-full w-full" />

      {ready && (
        <>
          {!started ? (
            <button
              type="button"
              onClick={startWithSound}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/45 backdrop-blur-[2px] transition hover:bg-black/40"
              aria-label="Ativar som e reproduzir"
            >
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600 shadow-glow transition group-hover:scale-105">
                <Play className="ml-1 h-10 w-10 text-white" />
              </span>
              <span className="flex items-center gap-2 rounded-full bg-black/60 px-5 py-2.5 text-base font-bold text-white backdrop-blur">
                <VolumeX className="h-5 w-5" /> Ativar som
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={togglePlay}
              className="absolute inset-0 z-10 flex items-center justify-center"
              aria-label={playing ? "Pausar" : "Reproduzir"}
            >
              {!playing && (
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600 shadow-glow">
                  <Play className="h-8 w-8 text-white" />
                </span>
              )}
            </button>
          )}

          <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
            <button
              type="button"
              onClick={toggleMute}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
              aria-label={muted ? "Ativar som" : "Silenciar"}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>

            <span className="hidden items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-teal-300 backdrop-blur sm:inline-flex">
              <Sparkles className="h-3 w-3" /> Progresso Inteligente™
            </span>

            <button
              type="button"
              onClick={cycleSpeed}
              className="flex h-9 items-center gap-1.5 rounded-full bg-black/60 px-3 text-xs font-bold text-white backdrop-blur transition hover:bg-black/80"
              aria-label="Velocidade de reprodução"
            >
              <Gauge className="h-4 w-4" />
              {speed.toLocaleString("pt-BR")}x
            </button>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-20">
            <div className="relative h-1 w-full bg-white/15">
              <div
                className="absolute inset-y-0 left-0 rounded-r-full bg-gradient-to-r from-teal-400 to-amber-500 transition-[width] duration-300 ease-out"
                style={{ width: `${smartProgress * 100}%` }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
