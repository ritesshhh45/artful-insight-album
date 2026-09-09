import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AnnouncementBar, Footer, Header } from "@/components/SiteChrome";
import { useCart } from "@/lib/cart";
import { couponDiscount, findCoupon, inr, type Coupon } from "@/lib/store";
import { imageUrl, onImageError } from "@/lib/img";
import { supabase } from "@/integrations/supabase/client";

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
const FIELDS = [
  ["customer_name", "Full name"],
  ["phone", "Mobile number"],
  ["email", "Email"],
  ["address", "Address"],
  ["city", "City"],
  ["pincode", "Pincode"],
] as const;

function Checkout() {
  const cart = useCart();
  const [pay, setPay] = useState("UPI");
  const [placed, setPlaced] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);

  const off = coupon ? couponDiscount(coupon, cart.subtotal) : 0;
  const total = Math.max(0, cart.subtotal - off) + cart.shipping;

  const applyCoupon = async () => {
    setCouponMsg(null);
    const found = await findCoupon(code);
    if (!found) {
      setCoupon(null);
      return setCouponMsg("That code is not valid.");
    }
    const value = couponDiscount(found, cart.subtotal);
    if (value <= 0) {
      setCoupon(null);
      return setCouponMsg(
        found.min_order > cart.subtotal
          ? `Minimum order for this code is ${inr(found.min_order)}.`
          : "That code has expired.",
      );
    }
    setCoupon(found);
    setCouponMsg(`${found.code} applied — you saved ${inr(value)}.`);
  };

  const placeOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (cart.items.length === 0) return setError("Your bag is empty.");
    setBusy(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      customer_name: String(form.get("customer_name") ?? ""),
      phone: String(form.get("phone") ?? ""),
      email: String(form.get("email") ?? ""),
      address: String(form.get("address") ?? ""),
      city: String(form.get("city") ?? ""),
      pincode: String(form.get("pincode") ?? ""),
      payment_method: pay,
      coupon_code: coupon?.code ?? null,
      subtotal: cart.subtotal,
      discount: off,
      shipping: cart.shipping,
      total,
    };

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(payload)
      .select("id, order_no")
      .single();

    if (orderError || !order) {
      setBusy(false);
      return setError("We could not place your order. Please try again.");
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      cart.items.map((l) => ({
        order_id: order.id,
        product_id: l.productId,
        name: l.name,
        image: l.image,
        size: l.size,
        colour: l.colour,
        qty: l.qty,
        price: l.price,
      })),
    );

    setBusy(false);
    if (itemsError) return setError("We could not save your items. Please try again.");

    cart.clear();
    setPlaced(order.order_no);
  };

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="mx-auto max-w-[1100px] px-5 pb-28 pt-10 md:px-10">
        {placed ? (
          <div className="py-24 text-center">
            <h1 className="text-[clamp(2rem,6vw,4rem)] leading-none">ORDER PLACED</h1>
            <p className="mt-4 text-sm text-muted-foreground">
              Your order number is <span className="font-bold text-foreground">#{placed}</span>. We
              will call you to confirm delivery details.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-[clamp(2rem,6vw,4rem)] leading-none">CHECKOUT</h1>
            <div className="mt-10 grid gap-12 md:grid-cols-[1.2fr_1fr]">
              <form onSubmit={placeOrder} className="space-y-4">
                {FIELDS.map(([name, label]) => (
                  <input
                    key={name}
                    name={name}
                    required={name !== "email"}
                    placeholder={label}
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
                {error && <p className="text-[12px] text-accent">{error}</p>}
                <button
                  disabled={busy}
                  className="mt-4 w-full bg-primary py-4 text-[11px] font-bold tracking-[0.3em] text-primary-foreground transition-colors hover:bg-accent disabled:opacity-50"
                >
                  {busy ? "PLACING ORDER…" : `PLACE ORDER · ${inr(total)}`}
                </button>
              </form>

              <aside className="h-fit border border-border p-6">
                <p className="eyebrow">ORDER SUMMARY</p>
                <div className="mt-5 space-y-4">
                  {cart.items.map((line) => (
                    <div key={line.productId + line.size} className="flex gap-3">
                      <img
                        src={imageUrl(line.image)}
                        onError={onImageError}
                        alt={line.name}
                        className="h-20 w-16 object-cover"
                      />
                      <div className="text-[12px]">
                        <p className="font-semibold">{line.name}</p>
                        <p className="text-muted-foreground">
                          Size {line.size} · Qty {line.qty}
                        </p>
                        <p className="mt-1 font-bold">{inr(line.price * line.qty)}</p>
                      </div>
                    </div>
                  ))}
                  {cart.items.length === 0 && (
                    <p className="text-sm text-muted-foreground">Your bag is empty.</p>
                  )}
                </div>

                <div className="mt-6 flex gap-2 border-t border-border pt-4">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Coupon code"
                    className="w-full border border-input bg-transparent px-3 py-2 text-xs uppercase outline-none focus:border-foreground"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    className="border border-foreground px-4 text-[10px] font-bold tracking-[0.18em]"
                  >
                    APPLY
                  </button>
                </div>
                {couponMsg && <p className="mt-2 text-[11px] text-accent">{couponMsg}</p>}

                <div className="mt-6 space-y-1 border-t border-border pt-4 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{inr(cart.subtotal)}</span>
                  </div>
                  {off > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount</span>
                      <span>−{inr(off)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{cart.shipping === 0 ? "FREE" : inr(cart.shipping)}</span>
                  </div>
                  <div className="flex justify-between pt-2 text-sm font-bold">
                    <span>TOTAL</span>
                    <span>{inr(total)}</span>
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
