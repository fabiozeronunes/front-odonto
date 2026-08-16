import { useEffect, useState } from "react";
import { Save, QrCode, Landmark } from "lucide-react";
import { api } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select";
import { InfoPopover } from "../../components/ui/info-popover";

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

      <div className="mt-6">
        <Button onClick={save} disabled={saving}>
          <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar dados"}
        </Button>
      </div>
    </div>
  );
}