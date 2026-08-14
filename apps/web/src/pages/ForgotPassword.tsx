import { useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, CheckCircle2 } from "lucide-react";
import { api, ApiRequestError } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
        skipAuth: true,
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Erro ao solicitar recuperação");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="mb-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-700 text-primary-foreground">
          <KeyRound className="h-6 w-6" />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Recuperar senha</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Informe seu e-mail para receber as instruções
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          {sent ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-primary-600" />
              <p className="mt-3 font-medium text-foreground">Solicitação enviada</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Se o e-mail existir, você receberá as instruções para redefinir sua senha.
              </p>
              <Link to="/login" className="mt-4">
                <Button variant="outline">Voltar ao login</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              {error && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</div>
              )}
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar instruções"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
