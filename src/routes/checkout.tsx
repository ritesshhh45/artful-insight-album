import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AnnouncementBar, Footer, Header } from "@/components/SiteChrome";
import { FREE_SHIPPING, useCart } from "@/lib/cart";
import { inr } from "@/lib/products";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — 11:11 STORE" },
      {
        name: "description",
        content: "Fast, secure checkout at 11:11 STORE. UPI, cards, net banking and COD.",
      },
      { property: "og:title", content: "Checkout — 11:11 STORE" },
      { property: "og:description", content: "UPI, cards, net banking and cash on delivery." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Checkout,
});

const PAYMENTS = ["UPI", "CARDS", "NET BANKING", "COD"];

function Checkout() {
  const cart = useCart();
  const [pay, setPay] = useState("UPI");
  const [placed, setPlaced] = useState(false);
  const shipping = cart.subtotal >= FREE_SHIPPING || cart.subtotal === 0 ? 0 : 79;

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="mx-auto max-w-[1100px] px-5 pb-28 pt-10 md:px-10">
        {placed ? (
          <div className="py-24 text-center">
            <h1 className="text-[clamp(2rem,6vw,4rem)] leading-none">ORDER PLACED</h1>
            <p className="mt-4 text-sm text-muted-foreground">
              This is a demo checkout — no payment was taken. Connect payments to accept real
              orders.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-[clamp(2rem,6vw,4rem)] leading-none">CHECKOUT</h1>
            <div className="mt-10 grid gap-12 md:grid-cols-[1.2fr_1fr]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setPlaced(true);
                }}
                className="space-y-4"
              >
                {["Full name", "Mobile number", "Email", "Address", "City", "Pincode"].map((f) => (
                  <input
                    key={f}
                    required
                    placeholder={f}
                    className="w-full border border-input bg-transparent px-4 py-3.5 text-sm outline-none focus:border-foreground"
                  />
                ))}
                <div>
                  <p className="eyebrow mt-6">PAYMENT</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {PAYMENTS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPay(p)}
                        className={`border py-3 text-[11px] font-bold tracking-[0.2em] ${
                          pay === p
                            ? "border-foreground bg-primary text-primary-foreground"
                            : "border-border"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <button className="mt-4 w-full bg-primary py-4 text-[11px] font-bold tracking-[0.3em] text-primary-foreground transition-colors hover:bg-accent">
                  PLACE ORDER · {inr(cart.subtotal + shipping)}
                </button>
              </form>

              <aside className="h-fit border border-border p-6">
                <p className="eyebrow">ORDER SUMMARY</p>
                <div className="mt-5 space-y-4">
                  {cart.items.map(({ line, product }) => (
                    <div key={line.slug + line.size} className="flex gap-3">
                      <img src={product.image} alt={product.name} className="h-20 w-16 object-cover" />
                      <div className="text-[12px]">
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-muted-foreground">
                          Size {line.size} · Qty {line.qty}
                        </p>
                        <p className="mt-1 font-bold">{inr(product.price * line.qty)}</p>
                      </div>
                    </div>
                  ))}
                  {cart.items.length === 0 && (
                    <p className="text-sm text-muted-foreground">Your bag is empty.</p>
                  )}
                </div>
                <div className="mt-6 space-y-1 border-t border-border pt-4 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{inr(cart.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{shipping === 0 ? "FREE" : inr(shipping)}</span>
                  </div>
                  <div className="flex justify-between pt-2 text-sm font-bold">
                    <span>TOTAL</span>
                    <span>{inr(cart.subtotal + shipping)}</span>
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
