import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import { cn } from "../../lib/utils";

interface InfoPopoverProps {
  text: string;
  title?: string;
  className?: string;
}

export function InfoPopover({ text, title, className }: InfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <span ref={wrapRef} className={cn("relative inline-flex align-middle", className)}>
      <button
        type="button"
        aria-label="Saiba mais"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary-700"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-card">
          {title && <p className="mb-1 text-xs font-semibold text-slate-900">{title}</p>}
          <p className="text-xs leading-relaxed text-slate-600">{text}</p>
        </span>
      )}
    </span>
  );
}
