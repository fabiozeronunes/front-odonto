import { useEffect, useState } from "react";
import { Save, QrCode, Landmark, Copy, Check, Eye } from "lucide-react";
import { api } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { InfoPopover } from "../../components/ui/info-popover";
import { formatPrice } from "../../lib/utils";

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

const PIX_TYPES = [
  { value: "cpf", label: "CPF" },
  { value: "cnpj", label: "CNPJ" },
  { value: "email", label: "E-mail" },
  { value: "telefone", label: "Telefone" },
  { value: "aleatoria", label: "Chave aleatória" },
];

export function AdminFinanceiro() {
  const [form, setForm] = useState<PaymentSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const copied = false;

  useEffect(() => {
    api<{ data: PaymentSettings | null }>("/api/settings/payment", { skipAuth: true })
      .then((res) => setForm(res.data ?? {}))
      .catch(() => setForm({}))
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof PaymentSettings>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setNotice(null);
    try {
      await api("/api/settings/payment", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setNotice("Dados de pagamento salvos. A tela de Pix já usa estas informações.");
    } catch {
      setNotice("Falha ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />;
  }

  return (
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
        Dados financeiros
        <InfoPopover
          title="Dados para pagamento"
          text="Estes dados aparecem na tela de pagamento via Pix para os alunos. Preencha a chave Pix, o banco e o beneficiário. O aluno paga o Pix e você confirma o pagamento na lista de usuários."
        />
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Configure a chave Pix e os dados bancários exibidos para o aluno pagar a assinatura.
      </p>

      {notice && (
        <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <QrCode className="h-4 w-4" /> Pix
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pixKeyType">Tipo da chave Pix</Label>
              <Select
                id="pixKeyType"
                value={form.pixKeyType ?? ""}
                onChange={(e) => update("pixKeyType", e.target.value)}
              >
                <option value="">Selecione...</option>
                {PIX_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pixKey">Chave Pix</Label>
              <Input
                id="pixKey"
                placeholder="000.000.000-00 ou chave aleatória"
                value={form.pixKey ?? ""}
                onChange={(e) => update("pixKey", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="beneficiary">Nome do beneficiário</Label>
              <Input
                id="beneficiary"
                placeholder="Nome da pessoa/empresa que recebe"
                value={form.beneficiary ?? ""}
                onChange={(e) => update("beneficiary", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cpfCnpj">CPF / CNPJ</Label>
              <Input
                id="cpfCnpj"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                value={form.cpfCnpj ?? ""}
                onChange={(e) => update("cpfCnpj", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Landmark className="h-4 w-4" /> Dados bancários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="bankName">Banco</Label>
              <Input
                id="bankName"
                placeholder="Ex.: Banco do Brasil, Nubank, Itaú..."
                value={form.bankName ?? ""}
                onChange={(e) => update("bankName", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="agency">Agência</Label>
                <Input
                  id="agency"
                  placeholder="0000"
                  value={form.agency ?? ""}
                  onChange={(e) => update("agency", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="account">Conta</Label>
                <Input
                  id="account"
                  placeholder="0000000-0"
                  value={form.account ?? ""}
                  onChange={(e) => update("account", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Instruções para o aluno</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            className="flex min-h-[100px] w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
            placeholder="Ex.: Envie o comprovante pelo WhatsApp para liberarmos seu acesso..."
            value={form.instructions ?? ""}
            onChange={(e) => update("instructions", e.target.value)}
          />
        </CardContent>
      </Card>

      <Card className="mt-6 border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="h-4 w-4" /> Prévia da tela de pagamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-xs text-slate-500">
            Como o aluno verá os dados de pagamento. A prévia atualiza conforme você digita.
          </p>
          <div className="mx-auto max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-center">
              <Badge className="bg-primary-100 text-primary-800">Pagamento via Pix</Badge>
              <h3 className="mt-3 font-display text-lg font-bold text-slate-900">
                Pagamento em análise
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Sua assinatura está <strong>aguardando pagamento</strong>.
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-900">Plano Premium</p>
                  <p className="text-xs text-slate-500">Pedido #XXXXXXXX</p>
                </div>
                <p className="text-lg font-extrabold text-slate-900">{formatPrice(718.8)}</p>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Chave Pix ({form.pixKeyType || "pix"})
              </p>
              <p className="mt-1 break-all font-mono text-sm font-semibold text-slate-900">
                {form.pixKey || "—"}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Chave copiada!" : "Copiar chave Pix"}
              </div>

              {form.bankName && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                  <Landmark className="h-3.5 w-3.5" />
                  {form.bankName}
                  {form.agency && <span>· Agência {form.agency}</span>}
                  {form.account && <span>· Conta {form.account}</span>}
                </p>
              )}

              {form.beneficiary && (
                <p className="mt-1 text-xs text-slate-500">Beneficiário: {form.beneficiary}</p>
              )}

              {form.cpfCnpj && <p className="mt-1 text-xs text-slate-500">CPF/CNPJ: {form.cpfCnpj}</p>}

              {form.instructions && (
                <p className="mt-3 rounded-lg bg-primary-50 p-2.5 text-xs text-primary-800">
                  {form.instructions}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <Button onClick={save} disabled={saving}>
          <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar dados"}
        </Button>
      </div>
    </div>
  );
}