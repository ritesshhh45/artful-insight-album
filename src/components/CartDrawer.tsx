import { Link } from "@tanstack/react-router";
import { FREE_SHIPPING, useCart } from "@/lib/cart";
import { inr } from "@/lib/products";

export function CartDrawer() {
  const cart = useCart();
  const remaining = Math.max(0, FREE_SHIPPING - cart.subtotal);
  const shipping = cart.subtotal === 0 || remaining > 0 ? (cart.subtotal === 0 ? 0 : 79) : 0;

  return (
    <>
      <div
        onClick={() => cart.setOpen(false)}
        className={`fixed inset-0 z-50 bg-ink/50 backdrop-blur-[2px] transition-opacity duration-500 ${
          cart.open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-dvh w-full max-w-[420px] flex-col bg-background transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${
          cart.open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg">YOUR BAG ({cart.count})</h2>
          <button onClick={() => cart.setOpen(false)} className="eyebrow hover:text-accent">
            CLOSE
          </button>
        </header>

        <div className="border-b border-border px-5 py-3">
          <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            {remaining > 0
              ? `You are ${inr(remaining)} away from FREE SHIPPING.`
              : "You have unlocked FREE SHIPPING."}
          </p>
          <div className="mt-2 h-[2px] w-full bg-secondary">
            <div
              className="h-full bg-accent transition-all duration-700"
              style={{ width: `${Math.min(100, (cart.subtotal / FREE_SHIPPING) * 100)}%` }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {cart.items.length === 0 && (
            <p className="py-16 text-center text-sm text-muted-foreground">Your bag is empty.</p>
          )}
          {cart.items.map(({ line, product }) => (
            <div key={line.slug + line.size} className="flex gap-4 border-b border-border py-4">
              <img
                src={product.image}
                alt={product.name}
                className="h-28 w-22 shrink-0 object-cover"
              />
              <div className="flex-1">
                <p className="text-[12px] font-semibold tracking-wide">{product.name}</p>
                <p className="mt-1 text-[11px] tracking-[0.18em] text-muted-foreground">
                  SIZE {line.size}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center border border-border">
                    <button
                      className="px-2 py-1 text-sm"
                      onClick={() => cart.setQty(line.slug, line.size, line.qty - 1)}
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-xs">{line.qty}</span>
                    <button
                      className="px-2 py-1 text-sm"
                      onClick={() => cart.setQty(line.slug, line.size, line.qty + 1)}
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[12px] font-bold">{inr(product.price * line.qty)}</span>
                  <button
                    onClick={() => cart.remove(line.slug, line.size)}
                    className="ml-auto text-[10px] tracking-[0.18em] text-muted-foreground hover:text-accent"
                  >
                    REMOVE
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <footer className="border-t border-border px-5 py-4">
          <div className="flex justify-between text-[12px]">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">{inr(cart.subtotal)}</span>
          </div>
          <div className="mt-1 flex justify-between text-[12px]">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-semibold">{shipping === 0 ? "FREE" : inr(shipping)}</span>
          </div>
          <div className="mt-3 flex justify-between border-t border-border pt-3 text-sm font-bold">
            <span>TOTAL</span>
            <span>{inr(cart.subtotal + shipping)}</span>
          </div>
          <Link
            to="/checkout"
            onClick={() => cart.setOpen(false)}
            className="mt-4 block bg-primary py-4 text-center text-[11px] font-bold tracking-[0.28em] text-primary-foreground transition-colors hover:bg-accent"
          >
            CHECKOUT
          </Link>
          <p className="mt-2 text-center text-[10px] tracking-[0.18em] text-muted-foreground">
            COD AVAILABLE · EASY EXCHANGE
          </p>
        </footer>
      </aside>
    </>
  );
}
