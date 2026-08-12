import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  User as UserIcon,
  Mail,
  ShieldCheck,
  Crown,
  CalendarDays,
  Film,
  BookOpen,
  Heart,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { api, ApiRequestError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatDate } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";

interface ProfileStats {
  videos: number;
  caseStudies: number;
  favorites: number;
}

export function Profile() {
  const { user, loading, updateProfile } = useAuth();
  const [stats, setStats] = useState<ProfileStats>({ videos: 0, caseStudies: 0, favorites: 0 });
  const [name, setName] = useState("");
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passMsg, setPassMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingPass, setSavingPass] = useState(false);

  useEffect(() => {
    setName(user?.name ?? "");
  }, [user?.name]);

  useEffect(() => {
    let active = true;
    Promise.all([
      api<{ pagination: { total: number } }>("/api/videos/me?perPage=1"),
      api<{ pagination: { total: number } }>("/api/case-studies/me?perPage=1"),
      api<{ pagination: { total: number } }>("/api/videos/me/favorites?perPage=1"),
    ])
      .then(([v, c, f]) => {
        if (!active) return;
        setStats({
          videos: v.pagination.total,
          caseStudies: c.pagination.total,
          favorites: f.pagination.total,
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function handleName(e: React.FormEvent) {
    e.preventDefault();
    setSavingName(true);
    setPassMsg(null);
    try {
      await updateProfile(name.trim());
      setNameMsg({ ok: true, text: "Nome atualizado com sucesso." });
    } catch (err) {
      setNameMsg({ ok: false, text: err instanceof ApiRequestError ? err.message : "Erro ao salvar" });
    } finally {
      setSavingName(false);
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setPassMsg(null);
    if (newPassword !== confirmPassword) {
      setPassMsg({ ok: false, text: "A confirmação não confere com a nova senha." });
      return;
    }
    setSavingPass(true);
    setNameMsg(null);
    try {
      await api<{ ok: boolean }>("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPassMsg({ ok: true, text: "Senha alterada com sucesso." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPassMsg({ ok: false, text: err instanceof ApiRequestError ? err.message : "Erro ao alterar senha" });
    } finally {
      setSavingPass(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-64 rounded-lg bg-slate-200" />
          <div className="h-40 rounded-2xl bg-slate-200" />
          <div className="h-40 rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const statItems = [
    { label: "Meus vídeos", value: stats.videos, to: "/meus-conteudos", icon: Film },
    { label: "Estudos de caso", value: stats.caseStudies, to: "/meus-conteudos", icon: BookOpen },
    { label: "Favoritos", value: stats.favorites, to: "/favoritos", icon: Heart },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900">
        <UserIcon className="h-7 w-7 text-primary-700" /> Meu perfil
      </h1>
      <p className="mt-1 text-slate-500">Gerencie seus dados, senha e acompanhe sua atividade.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados da conta</CardTitle>
              <CardDescription>Altere seu nome de exibição na plataforma.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleName} className="space-y-4">
                {nameMsg && (
                  <div
                    className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
                      nameMsg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    }`}
                  >
                    {nameMsg.ok ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    ) : (
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    )}
                    {nameMsg.text}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    minLength={2}
                    maxLength={120}
                    required
                  />
                </div>
                <Button type="submit" disabled={savingName || name.trim().length < 2}>
                  {savingName ? "Salvando..." : "Salvar nome"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <KeyRound className="h-5 w-5 text-primary-700" /> Alterar senha
              </CardTitle>
              <CardDescription>Use pelo menos 8 caracteres.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePassword} className="space-y-4">
                {passMsg && (
                  <div
                    className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${
                      passMsg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    }`}
                  >
                    {passMsg.ok ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    ) : (
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    )}
                    {passMsg.text}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha atual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova senha</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={savingPass}>
                  {savingPass ? "Alterando..." : "Alterar senha"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-700 text-2xl font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-900">{user.name}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                <Mail className="h-4 w-4" /> {user.email}
              </p>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <dt className="flex items-center gap-1.5 text-slate-500">
                    <ShieldCheck className="h-4 w-4" /> Perfil
                  </dt>
                  <dd className="font-medium text-slate-900">
                    {user.role === "ADMIN" ? "Administrador" : "Membro"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="flex items-center gap-1.5 text-slate-500">
                    <Crown className="h-4 w-4" /> Plano
                  </dt>
                  <dd className="font-medium capitalize text-slate-900">
                    {user.plan?.name ?? "Gratuito"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="flex items-center gap-1.5 text-slate-500">
                    <CalendarDays className="h-4 w-4" /> Membro desde
                  </dt>
                  <dd className="font-medium text-slate-900">
                    {user.createdAt ? formatDate(user.createdAt) : "—"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="h-4 w-4 text-primary-700" /> Minha atividade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {statItems.map(({ label, value, to, icon: Icon }) => (
                <Link
                  key={label}
                  to={to}
                  className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 transition-colors hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Icon className="h-4 w-4 text-slate-400" /> {label}
                  </span>
                  <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-sm font-bold text-primary-800">
                    {value}
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
