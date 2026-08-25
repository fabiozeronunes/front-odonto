import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";

type ConfirmFn = (message: string, options?: { confirmLabel?: string }) => Promise<boolean>;

let activeConfirm: ConfirmFn | null = null;

export function confirmAction(message: string, options?: { confirmLabel?: string }): Promise<boolean> {
  if (activeConfirm) return activeConfirm(message, options);
  return Promise.resolve(window.confirm(message));
}

interface PendingRequest {
  message: string;
  confirmLabel?: string;
  resolve: (ok: boolean) => void;
}

export function ConfirmProvider() {
  const [pending, setPending] = useState<PendingRequest | null>(null);

  useEffect(() => {
    activeConfirm = (message, options) =>
      new Promise<boolean>((resolve) => {
        setPending({ message, confirmLabel: options?.confirmLabel, resolve });
      });
    return () => {
      activeConfirm = null;
    };
  }, []);

  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        pending.resolve(false);
        setPending(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending]);

  if (!pending) return null;

  function settle(ok: boolean) {
    pending!.resolve(ok);
    setPending(null);
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-label="Confirmação"
      onClick={() => settle(false)}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Confirmação</h3>
        </div>
        <p className="text-sm text-foreground">{pending.message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => settle(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => settle(true)}>
            {pending.confirmLabel ?? "Confirmar"}
          </Button>
        </div>
      </div>
    </div>
  );
}