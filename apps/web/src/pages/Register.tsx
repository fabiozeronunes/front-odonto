import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, Check } from "lucide-react";
import { useAuth } from "../lib/auth";
import { api, ApiRequestError } from "../lib/api";
import { useSiteLogo } from "../lib/useSiteLogo";
import type { MembershipPlan } from "../types";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { cn } from "../lib/utils";
import { formatPrice } from "../lib/utils";

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const logoUrl = useSiteLogo();
  const [searchParams] = useSearchParams();
  const ref = searchParams.get("ref") ?? undefined;
  const initialPlan = searchParams.get("plan") ?? "gratuito";
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [planSlug, setPlanSlug] = useState(initialPlan);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<{ data: MembershipPlan[] }>("/api/plans")
      .then((data) => {
        const active = data.data.filter((p) => p.status === "ACTIVE");
        setPlans(active);
        if (!active.some((p) => p.slug === planSlug) && active.length > 0) {
          setPlanSlug(active[0].slug);
        }
      })
      .catch(() => {});
  }, []);

  const selectedPlan = plans.find((p) => p.slug === planSlug);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(name, email, password, ref, planSlug, phone);
      if (planSlug && planSlug !== "gratuito") {
        navigate(`/checkout?plan=${planSlug}`, { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Erro ao cadastrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="mb-8 text-center">
        <Link to="/" className="mx-auto flex justify-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="OdontoStudy"
              className="h-auto w-[70vw] max-w-full object-contain md:max-w-[240px] lg:max-w-[220px]"
            />
          ) : (
            <span className="font-display text-2xl font-bold text-primary-700 dark:text-primary-400">
              Odontus
            </span>
          )}
        </Link>
        <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Crie sua conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">Escolha seu plano e comece a estudar</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cadastro</CardTitle>
          <CardDescription>Preencha seus dados para começar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label>Plano de uso</Label>
              <div className="grid gap-2">
                {plans.length === 0 ? (
                  <div className="h-16 animate-pulse rounded-lg bg-muted" />
                ) : (
                  plans.map((p) => {
                    const isSelected = planSlug === p.slug;
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => setPlanSlug(p.slug)}
                        className={cn(
                          "flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors",
                          isSelected
                            ? "border-primary-600 bg-primary-50 dark:border-primary-400 dark:bg-primary-950/40"
                            : "border-border hover:border-foreground/40"
                        )}
                      >
                        <div>
                          <p className="text-sm font-bold text-foreground">
                            {p.name === "Odonto PREMIUM"
                              ? "Premium"
                              : p.name === "Odonto Pro"
                                ? "Pro"
                                : p.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {p.slug === "gratuito"
                              ? "Acesso a conteúdos gratuitos"
                              : p.billing === "YEARLY"
                                ? "Pagamento anual"
                                : "Pagamento mensal"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-foreground">
                            {p.slug === "gratuito"
                              ? "Grátis"
                              : formatPrice(p.price)}
                          </span>
                          <span
                            className={cn(
                              "flex h-5 w-5 items-center justify-center rounded-full border",
                              isSelected ? "border-primary-600 bg-primary-600 text-white" : "border-border"
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone / WhatsApp</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo de 8 caracteres"
              />
            </div>

            {selectedPlan && selectedPlan.slug !== "gratuito" && (
              <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                Você selecionou o plano{" "}
                <strong>{selectedPlan.name === "Odonto PREMIUM" ? "Premium" : "Pro"}</strong>. Após criar
                a conta, você confirma o pagamento no checkout para liberar o acesso.
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading || plans.length === 0}>
              {loading ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/login" className="font-medium text-primary-700 hover:text-primary-800">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}