import { useEffect, useState } from "react";
import { api } from "./api";

export function useSiteLogo() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api<{ data: string | null }>("/api/settings/logo", { skipAuth: true })
      .then((res) => {
        if (active) setLogoUrl(res.data ?? null);
      })
      .catch(() => {
        if (active) setLogoUrl(null);
      });
    return () => {
      active = false;
    };
  }, []);

  return logoUrl;
}