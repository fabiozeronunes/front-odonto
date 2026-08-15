import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, Phone, Mail, User } from "lucide-react";
import { useAuth } from "../lib/auth";
import { ApiRequestError } from "../lib/api";
import { useSiteLogo } from "../lib/useSiteLogo";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const logoUrl = useSiteLogo();
  const [searchParams] = useSearchParams();
  const ref = searchParams.get("ref") ?? undefined;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(name, email, password, ref, undefined, phone);
      navigate("/planos", { replace: true });
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
        <p className="mt-1 text-sm text-muted-foreground">
          Preencha seus dados e depois escolha seu plano
        </p>
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
              <Label htmlFor="name">Nome completo</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="name"
                  required
                  minLength={2}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone / WhatsApp</Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="pl-9"
                />
              </div>
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando conta..." : "Salvar e escolher plano"}
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
