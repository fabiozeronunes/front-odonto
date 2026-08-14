import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, Check, Lock, Package, ShieldCheck, ShoppingBag } from "lucide-react";
import { api, ApiRequestError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useCart } from "../lib/cart";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { formatPrice, resolveImageUrl } from "../lib/utils";

interface OrderResponse {
  id: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
}

export function StoreCheckout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { items, subtotal, discount, total, clear } = useCart();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<OrderResponse | null>(null);

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <Check className="h-8 w-8 text-emerald-600" />
        </span>
        <h1 className="mt-6 text-3xl font-bold text-slate-900">Pedido confirmado!</h1>
        <p className="mt-2 text-slate-500">
          Pedido <strong>#{done.id.slice(-8).toUpperCase()}</strong> no valor de{" "}
          <strong>{formatPrice(done.total)}</strong>. Em breve entraremos em contato para a entrega.
        </p>
        <div className="mt-8 flex justify-center gap-2">
          <Link to="/loja">
            <Button variant="outline">Voltar à loja</Button>
          </Link>
          <Button onClick={() => navigate("/dashboard")}>Ir para o painel</Button>
        </div>
      </div>
    );
  }

  async function handleConfirm() {
    if (items.length === 0) return;
    setProcessing(true);
    setError(null);
    try {
      const order = await api<{ data: OrderResponse }>("/api/products/orders", {
        method: "POST",
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });
      await api(`/api/products/orders/${order.data.id}/confirm`, { method: "POST" });
      setDone(order.data);
      clear();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Erro ao processar o pedido");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-800">
          <ShoppingBag className="h-3 w-3" /> Finalizar compra
        </span>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">Checkout</h1>
        <p className="mt-2 text-slate-500">Confirme os itens do Shop Odontus para concluir seu pedido.</p>
      </div>

      {error && (
        <div className="mt-6 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Itens do pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.length === 0 ? (
              <div className="py-8 text-center">
                <Package className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">Seu carrinho está vazio.</p>
                <Link to="/loja" className="mt-3 inline-block">
                  <Button variant="outline" size="sm">Ir para a loja</Button>
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.productId} className="flex items-center gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                    {item.image ? (
                      <img src={resolveImageUrl(item.image)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-slate-300">
                        <Package className="h-6 w-6" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-400">Qtd: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">{formatPrice((item.promoPrice ?? item.price) * item.quantity)}</span>
                </div>
              ))
            )}
            <div className="border-t border-slate-100 pt-3">
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-500">
                  <dt>Subtotal</dt>
                  <dd>{formatPrice(subtotal)}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <dt>Descontos</dt>
                    <dd>-{formatPrice(discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-slate-900">
                  <dt>Total</dt>
                  <dd>{formatPrice(total)}</dd>
                </div>
              </dl>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
              <p className="text-sm text-slate-600">{user?.email}</p>
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="w-full"
            disabled={processing || items.length === 0}
            onClick={handleConfirm}
          >
            {processing ? "Processando..." : `Confirmar compra ${formatPrice(total)}`}
          </Button>

          <Link to="/carrinho">
            <Button variant="ghost" size="sm" className="w-full">
              <ArrowLeft className="h-4 w-4" /> Voltar ao carrinho
            </Button>
          </Link>

          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
            <Lock className="h-3 w-3" /> Pedido seguro · Estoque reservado após a confirmação.
          </p>
          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
            <ShieldCheck className="h-3 w-3" /> Em breve você poderá pagar com Pix ou cartão de crédito.
          </p>
        </div>
      </div>
    </div>
  );
}