/// <reference types="vite/client" />

interface Window {
  YT?: {
    Player: new (
      elementId: string | HTMLElement,
      options: Record<string, unknown>
    ) => import("./components/HeroVideoPlayer").YTPlayerLike;
  };
  onYouTubeIframeAPIReady?: () => void;
}
