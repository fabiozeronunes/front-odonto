import { useState } from "react";
import { Link2, Copy, Check, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { useAuth } from "../lib/auth";

const WEB_URL = import.meta.env.VITE_APP_URL ?? "https://front-odonto-web.vercel.app";

export function AffiliateShareCard() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!user?.isAffiliate || !user?.affiliateCode) return null;

  const link = `${WEB_URL}/cadastro?ref=${user.affiliateCode}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const el = document.createElement("textarea");
      el.value = link;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="border-emerald-200 bg-emerald-50">
      <CardContent className="pt-5">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
          <Link2 className="h-5 w-5 text-emerald-600" /> Programa de Afiliados
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Compartilhe seu link de indicação e ganhe comissão quando o aluno assinar um plano pago.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-2">
            <Users className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="truncate font-mono text-sm text-emerald-800">{link}</span>
          </div>
          <Button variant="outline" size="sm" className="shrink-0" onClick={copyLink}>
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" /> Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" /> Copiar link
              </>
            )}
          </Button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Seu código: <span className="font-mono font-semibold">{user.affiliateCode}</span> · As
          comissões ficam disponíveis no painel de afiliados.
        </p>
      </CardContent>
    </Card>
  );
}
