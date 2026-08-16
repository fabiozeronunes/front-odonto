import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Copy, Check, QrCode, Landmark, User as UserIcon, ArrowLeft } from "lucide-react";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { formatPrice } from "../lib/utils";

interface PaymentSettings {
  pixKey?: string;
  pixKeyType?: string;
  bankName?: string;
  agency?: string;
  account?: string;
  beneficiary?: string;
  cpfCnpj?: string;
  instructions?: string;
}

export function PixPayment() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";
  const planName = searchParams.get("plan") ?? "plano";
  const amount = Number(searchParams.get("amount") ?? "0");

  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api<{ data: PaymentSettings | null }>("/api/settings/payment", { skipAuth: true })
      .then((res) => setSettings(res.data))
      .catch(() => setSettings(null))
      .finally(() => setLoading(false));
  }, []);

  async function copyPixKey() {
    if (!settings?.pixKey) return;
    try {
      await navigator.clipboard.writeText(settings.pixKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  const displayPlan = planName === "odontus-premium" ? "Premium" : planName === "odontus-vip" ? "VIP" : planName;

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <Link
        to="/planos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar aos planos
      </Link>

      <div className="mt-4 text-center">
        <Badge className="bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
          <QrCode className="h-3 w-3" /> Pagamento via Pix
        </Badge>
        <h1 className="mt-4 font-display text-3xl font-bold text-foreground">Pagamento em análise</h1>
        <p className="mt-2 text-muted-foreground">
          Sua assinatura está <strong>aguardando pagamento</strong>. Realize o Pix abaixo e envie o
          comprovante.
        </p>
      </div>

      {loading ? (
        <div className="mt-8 h-64 animate-pulse rounded-2xl bg-muted" />
      ) : (
        <>
          <Card className="mt-8">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span>Resumo do pedido</span>
                <Badge variant="info">AGUARDANDO PAGAMENTO</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-foreground">Plano {displayPlan}</p>
                  <p className="text-sm text-muted-foreground">Pedido #{orderId.slice(0, 8).toUpperCase()}</p>
                </div>
                <p className="text-2xl font-extrabold text-foreground">{formatPrice(amount)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Landmark className="h-4 w-4" /> Dados para pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {settings?.pixKey ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-muted p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Chave Pix ({settings.pixKeyType ?? "pix"})
                    </p>
                    <p className="mt-1 break-all font-mono text-sm font-semibold text-foreground">
                      {settings.pixKey}
                    </p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={copyPixKey}>
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      {copied ? "Chave copiada!" : "Copiar chave Pix"}
                    </Button>
                  </div>

                  {settings.bankName && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Landmark className="h-4 w-4 shrink-0" />
                      {settings.bankName}
                      {settings.agency && <span>· Agência {settings.agency}</span>}
                      {settings.account && <span>· Conta {settings.account}</span>}
                    </div>
                  )}

                  {settings.beneficiary && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <UserIcon className="h-4 w-4 shrink-0" />
                      Beneficiário: {settings.beneficiary}
                    </div>
                  )}

                  {settings.cpfCnpj && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <UserIcon className="h-4 w-4 shrink-0" />
                      CPF/CNPJ: {settings.cpfCnpj}
                    </div>
                  )}

                  {settings.instructions && (
                    <p className="rounded-lg bg-primary-50 p-3 text-sm text-primary-800 dark:bg-primary-950 dark:text-primary-200">
                      {settings.instructions}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Após realizar o Pix, seu acesso será liberado assim que o pagamento for confirmado.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Os dados para pagamento ainda não foram configurados. Entre em contato com o suporte
                  para receber as instruções de pagamento.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="mt-6 flex justify-center">
            <Link to="/dashboard">
              <Button variant="outline">Ir para o painel</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}