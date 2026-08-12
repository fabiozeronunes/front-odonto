import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function resolveImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("/uploads/")) return `${API_URL}${url}`;
  return url;
}

export function formatDuration(seconds: number | null | undefined): string | null {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}min`;
  if (m > 0) return `${m}min ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatPrice(value: number | string | null | undefined): string {
  const num = Number(value ?? 0);
  return num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
