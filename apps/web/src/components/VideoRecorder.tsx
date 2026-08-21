import { useEffect, useRef, useState } from "react";
import { Camera, Pause, Play, Square, RotateCcw, Video, Trash2, RectangleHorizontal, RectangleVertical } from "lucide-react";
import { api } from "../lib/api";
import { Button } from "./ui/button";

interface VideoRecorderProps {
  onRecorded: (url: string) => void;
  onRemoved: () => void;
}

type Ratio = "16:9" | "9:16";

export function VideoRecorder({ onRecorded, onRemoved }: VideoRecorderProps) {
  const liveRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<"idle" | "preview" | "recording" | "paused" | "review" | "uploading" | "done">("idle");
  const [ratio, setRatio] = useState<Ratio>("16:9");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, []);

  function stopStream() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function fmt(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  function getConstraints(): MediaStreamConstraints {
    const isPortrait = ratio === "9:16";
    return {
      video: {
        facingMode: "environment",
        width: isPortrait ? { ideal: 720 } : { ideal: 1280 },
        height: isPortrait ? { ideal: 1280 } : { ideal: 720 },
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 22050,
      },
    };
  }

  async function openCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia(getConstraints());
      streamRef.current = stream;
      const el = liveRef.current;
      if (el) {
        el.srcObject = stream;
        el.muted = true;
        await el.play();
      }
      setPhase("preview");
    } catch {
      setError("Nao foi possivel acessar a camera. Verifique as permissoes do navegador.");
    }
  }

  function startRecording() {
    const stream = streamRef.current;
    if (!stream) return;

    let mime = "video/webm;codecs=vp8,opus";
    if (!MediaRecorder.isTypeSupported(mime)) {
      mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : "video/webm";
    }

    const recorder = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: 600_000,
      audioBitsPerSecond: 48_000,
    });
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
      const url = URL.createObjectURL(blob);
      setRecordedBlob(blob);
      setRecordedUrl(url);
      setPhase("review");
    };

    recorderRef.current = recorder;
    recorder.start(1000);
    setPhase("recording");
    setElapsed(0);
    timerRef.current = window.setInterval(() => setElapsed((s) => s + 1), 1000);
  }

  function togglePause() {
    const r = recorderRef.current;
    if (!r) return;
    if (r.state === "recording") {
      r.pause();
      setPhase("paused");
      if (timerRef.current) window.clearInterval(timerRef.current);
    } else if (r.state === "paused") {
      r.resume();
      setPhase("recording");
      timerRef.current = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    }
  }

  function stopRecording() {
    const r = recorderRef.current;
    if (!r || r.state === "inactive") return;
    if (timerRef.current) window.clearInterval(timerRef.current);
    r.stop();
  }

  function discard() {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setElapsed(0);
    setPhase("preview");
  }

  function cancelAll() {
    stopStream();
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setUploadedUrl(null);
    setElapsed(0);
    setPhase("idle");
  }

  async function uploadAndConfirm() {
    if (!recordedBlob) return;
    setPhase("uploading");
    stopStream();
    try {
      const form = new FormData();
      form.append("image", recordedBlob, "gravacao-aula.webm");
      const uploadRes = await api<{ data: { url: string } }>("/api/uploads", {
        method: "POST",
        body: form,
      });
      setUploadedUrl(uploadRes.data.url);
      onRecorded(uploadRes.data.url);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
      setRecordedBlob(null);
      setRecordedUrl(null);
      setElapsed(0);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no upload do video");
      setPhase("review");
    }
  }

  function removeUploaded() {
    setUploadedUrl(null);
    setPhase("idle");
    onRemoved();
  }

  const showLive = phase === "preview" || phase === "recording" || phase === "paused";
  const isPortrait = ratio === "9:16";

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Video element: always mounted, toggled via CSS */}
      <div
        className="rounded-xl border border-border overflow-hidden bg-black relative"
        style={{ display: showLive ? "block" : "none", aspectRatio: isPortrait ? "9/16" : "16/9" }}
      >
        <video
          ref={liveRef}
          className="h-full w-full object-cover"
          playsInline
          muted
        />
        {(phase === "recording" || phase === "paused") && (
          <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
            {fmt(elapsed)}
          </div>
        )}
      </div>

      {/* Review recorded video */}
      {phase === "review" && recordedUrl && (
        <div className="rounded-xl border border-border overflow-hidden">
          <video controls src={recordedUrl} className="w-full" preload="metadata" style={{ aspectRatio: isPortrait ? "9/16" : "16/9", objectFit: "contain" }} />
        </div>
      )}

      {/* Uploaded video (done) */}
      {phase === "done" && uploadedUrl && (
        <div className="rounded-xl border border-border overflow-hidden">
          <video controls src={uploadedUrl} className="w-full" preload="metadata" />
        </div>
      )}

      {/* Uploading spinner */}
      {phase === "uploading" && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/50 p-6">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Enviando video...</span>
        </div>
      )}

      {/* Aspect ratio selector + controls */}
      <div className="flex flex-wrap items-center gap-2">
        {phase === "idle" && (
          <>
            <div className="flex overflow-hidden rounded-lg border border-border mr-1">
              <button
                type="button"
                onClick={() => setRatio("16:9")}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${ratio === "16:9" ? "bg-primary-600 text-white" : "bg-muted text-muted-foreground"}`}
              >
                <RectangleHorizontal className="h-3.5 w-3.5" /> 16:9
              </button>
              <button
                type="button"
                onClick={() => setRatio("9:16")}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors ${ratio === "9:16" ? "bg-primary-600 text-white" : "bg-muted text-muted-foreground"}`}
              >
                <RectangleVertical className="h-3.5 w-3.5" /> 9:16
              </button>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={openCamera}>
              <Camera className="h-3.5 w-3.5" /> Abrir camera
            </Button>
          </>
        )}

        {phase === "preview" && (
          <>
            <Button type="button" variant="default" size="sm" onClick={startRecording}>
              <Video className="h-3.5 w-3.5" /> Gravar
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={cancelAll}>
              Cancelar
            </Button>
          </>
        )}

        {(phase === "recording" || phase === "paused") && (
          <>
            <Button type="button" variant="outline" size="sm" onClick={togglePause}>
              {phase === "paused" ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              {phase === "paused" ? "Continuar" : "Pausar"}
            </Button>
            <Button type="button" variant="default" size="sm" onClick={stopRecording}>
              <Square className="h-3.5 w-3.5" /> Parar
            </Button>
          </>
        )}

        {phase === "review" && (
          <>
            <Button type="button" variant="default" size="sm" onClick={uploadAndConfirm}>
              Enviar e usar
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={discard}>
              <RotateCcw className="h-3.5 w-3.5" /> Descartar
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={cancelAll}>
              Cancelar
            </Button>
          </>
        )}

        {phase === "done" && (
          <>
            <Button type="button" variant="outline" size="sm" onClick={openCamera}>
              <Camera className="h-3.5 w-3.5" /> Gravar outra
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={removeUploaded} className="text-red-600 hover:text-red-700">
              <Trash2 className="h-3.5 w-3.5" /> Excluir
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
