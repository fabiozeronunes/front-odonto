import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingCart, ArrowLeft, Package } from "lucide-react";
import { useCart } from "../lib/cart";
import { Button } from "../components/ui/button";
import { formatPrice, resolveImageUrl } from "../lib/utils";

export function Cart() {
  const { items, subtotal, discount, total, setQuantity, removeItem, clear } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <ShoppingCart className="mx-auto h-12 w-12 text-slate-300" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Seu carrinho está vazio</h1>
        <p className="mt-2 text-slate-500">Explore o Shop Odontus e aproveite os descontos.</p>
        <Link to="/loja" className="mt-6 inline-block">
          <Button>Ir para a loja</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900">
          <ShoppingCart className="h-7 w-7 text-primary-700" /> Carrinho
        </h1>
        <Button variant="ghost" size="sm" onClick={clear} className="text-red-600">
          Limpar carrinho
        </Button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          {items.map((item) => {
            const promo = item.promoPrice && item.promoPrice < item.price ? item.promoPrice : item.price;
            return (
              <div
                key={item.productId}
                className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card"
              >
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                  {item.image ? (
                    <img src={resolveImageUrl(item.image)} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-slate-300">
                      <Package className="h-8 w-8" />
                    </span>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.brand ?? "Odontus"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="text-slate-400 transition-colors hover:text-red-600"
                      aria-label={`Remover ${item.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setQuantity(item.productId, item.quantity - 1)}
                        aria-label="Diminuir quantidade"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center text-sm font-semibold text-slate-900">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setQuantity(item.productId, item.quantity + 1)}
                        aria-label="Aumentar quantidade"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-right">
                      {promo < item.price && (
                        <span className="mr-2 text-xs text-slate-400 line-through">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      )}
                      <span className="font-bold text-slate-900">{formatPrice(promo * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <Link to="/loja">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" /> Continuar comprando
            </Button>
          </Link>
        </div>

        <div className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-lg font-bold text-slate-900">Resumo</h2>
          <dl className="mt-4 space-y-2 text-sm">
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
            <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-bold text-slate-900">
              <dt>Total</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>
          <Link to="/checkout-loja" className="mt-6 block">
            <Button size="lg" className="w-full">
              Finalizar compra
            </Button>
          </Link>
          <p className="mt-3 text-center text-xs text-slate-400">
            O pagamento é confirmado no checkout e o pedido é enviado para separação.
          </p>
        </div>
      </div>
    </div>
  );
}