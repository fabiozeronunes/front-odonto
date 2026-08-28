import { useEffect, useRef, useState } from "react";
import { AudioLines, Mic, Pause, Play, Square, Trash2, Upload, CheckCircle2 } from "lucide-react";
import { api } from "../lib/api";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { cn } from "../lib/utils";

interface AudioRecorderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

interface PendingAudio {
  blob: Blob;
  blobUrl: string;
}

export function AudioRecorder({
  value,
  onChange,
  label = "Áudio (gravar ou importar)",
}: AudioRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState<PendingAudio | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      stopStream();
      if (pending?.blobUrl) URL.revokeObjectURL(pending.blobUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopStream() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime =
        MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stopStream();
        setRecording(false);
        setPaused(false);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const blobUrl = URL.createObjectURL(blob);
        // Salva LOCAL no dispositivo imediatamente: dispara download nativo
        // (no celular abre a opcao de escolha de pasta; no PC vai para Downloads)
        const a = document.createElement("a");
        a.href = blobUrl;
        const ext = blob.type.includes("webm") ? "webm" : "mp3";
        a.download = `audio-gravado-${new Date().toISOString().replace(/[:.]/g, "-")}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setPending({ blob, blobUrl });
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setElapsed(0);
      timerRef.current = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      if (msg.includes("Permission") || msg.includes("permission")) {
        setError("Permissão de microfone negada. Permita o acesso ao microfone nas configurações do navegador e tente novamente.");
      } else {
        setError(`Não foi possível acessar o microfone: ${msg}`);
      }
    }
  }

  function togglePause() {
    const r = recorderRef.current;
    if (!r) return;
    if (r.state === "recording") {
      r.pause();
      setPaused(true);
      if (timerRef.current) window.clearInterval(timerRef.current);
    } else if (r.state === "paused") {
      r.resume();
      setPaused(false);
      timerRef.current = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    }
  }

  function stopRecording() {
    const r = recorderRef.current;
    if (!r || r.state === "inactive") return;
    r.stop();
  }

  /** Sobe o áudio pendente para o servidor e só então persiste a URL no formulário */
  async function uploadPending() {
    if (!pending) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("image", pending.blob, "gravacao.webm");
      const res = await api<{ data: { url: string } }>("/api/uploads", {
        method: "POST",
        body: form,
      });
      onChange(res.data.url);
      if (pending.blobUrl) URL.revokeObjectURL(pending.blobUrl);
      setPending(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha no upload do áudio";
      setError(`Erro no upload: ${msg}. O áudio continua salvo no dispositivo — tente novamente.`);
    } finally {
      setUploading(false);
    }
  }

  function discardPending() {
    if (pending?.blobUrl) URL.revokeObjectURL(pending.blobUrl);
    setPending(null);
    setError(null);
  }

  /** Importar arquivo: também fica pendente (local) até o usuário confirmar o upload */
  function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    const blobUrl = URL.createObjectURL(file);
    // Garante tambem que o usuario tenha uma copia local do arquivo importado
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `audio-importado-${new Date().toISOString().replace(/[:.]/g, "-")}-${file.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setPending({ blob: file, blobUrl });
    if (fileRef.current) fileRef.current.value = "";
  }

  function format(sec: number) {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      {/* Áudio já persistido no formulário */}
      {value && !pending && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-700 text-white">
            <AudioLines className="h-5 w-5" />
          </span>
          <audio controls src={value} className="h-10 min-w-0 flex-1" preload="metadata" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange("")}
            className="text-red-600"
            title="Remover áudio"
            aria-label="Remover áudio"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Gravação pendente: salva local, aguarda confirmação de upload */}
      {pending && (
        <div className="rounded-xl border border-primary/30 bg-primary-50/40 p-3 dark:bg-primary-950/30 space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-700 text-white">
              <AudioLines className="h-5 w-5" />
            </span>
            <audio controls src={pending.blobUrl} className="h-10 min-w-0 flex-1" preload="metadata" />
          </div>
          <p className="text-xs text-muted-foreground">
            Áudio gravado e salvo no dispositivo. Clique em <strong>Enviar e usar</strong> para disponibilizá-lo na caixa de áudios.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={uploadPending} disabled={uploading}>
              {uploading ? (
                <span className="flex items-center gap-2"><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> Enviando...</span>
              ) : (
                <><Upload className="h-3.5 w-3.5" /> Enviar e usar</>
              )}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={discardPending} disabled={uploading}>
              <Trash2 className="h-3.5 w-3.5" /> Descartar
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {!recording && !paused ? (
          <Button type="button" variant="outline" size="sm" onClick={startRecording} disabled={uploading || !!pending}>
            <Mic className="h-3.5 w-3.5" /> Gravar
          </Button>
        ) : (
          <>
            <Button type="button" variant="outline" size="sm" onClick={togglePause}>
              {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />} {paused ? "Continuar" : "Pausar"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={stopRecording} disabled={uploading}>
              <Square className="h-3.5 w-3.5" /> Parar
            </Button>
          </>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || !!pending}
        >
          <Upload className="h-3.5 w-3.5" /> Importar arquivo
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="audio/webm,audio/mp3,audio/mpeg,audio/ogg,audio/wav,audio/mp4,.m4a"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold",
            recording ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"
          )}
        >
          {recording && <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />}
          {recording && !paused ? `Gravando ${format(elapsed)}` : paused ? `Pausado ${format(elapsed)}` : pending ? "No dispositivo" : "Sem áudio"}
        </span>
        {value && <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}