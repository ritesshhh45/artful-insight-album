import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AnnouncementBar, Footer, Header, MobileBar } from "@/components/SiteChrome";
import { ProductCard } from "@/components/ProductCard";
import { bySlug, discount, inr, products } from "@/lib/products";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => {
    const product = bySlug(params.slug);
    if (!product) throw notFound();
    return product;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} — 11:11 STORE` },
          { name: "description", content: loaderData.description.slice(0, 155) },
          { property: "og:title", content: `${loaderData.name} — 11:11 STORE` },
          { property: "og:description", content: loaderData.description.slice(0, 155) },
          { property: "og:type", content: "product" },
          { property: "og:image", content: loaderData.image },
          { name: "twitter:image", content: loaderData.image },
          { name: "twitter:card", content: "summary_large_image" },
        ]
      : [],
  }),
  component: ProductPage,
});

function ProductPage() {
  const product = Route.useLoaderData();
  const cart = useCart();
  const [size, setSize] = useState<string | null>(null);
  const [colour, setColour] = useState(product.colours[0]!);
  const [err, setErr] = useState(false);

  const addToCart = () => {
    if (!size) return setErr(true);
    cart.add(product.slug, size);
  };

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="mx-auto max-w-[1400px] px-5 pb-28 pt-8 md:px-10">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="space-y-3">
            <img
              src={product.image}
              alt={product.name}
              className="w-full bg-secondary object-cover"
            />
            <div className="grid grid-cols-3 gap-3">
              {products
                .filter((p) => p.slug !== product.slug)
                .slice(0, 3)
                .map((p) => (
                  <img
                    key={p.slug}
                    src={p.image}
                    alt={`${product.name} styled look`}
                    loading="lazy"
                    className="aspect-square w-full object-cover"
                  />
                ))}
            </div>
          </div>

          <div className="md:sticky md:top-24 md:h-fit">
            <p className="eyebrow text-accent">{product.category}</p>
            <h1 className="mt-3 text-[clamp(1.8rem,4vw,3rem)] leading-none">{product.name}</h1>
            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-2xl font-bold">{inr(product.price)}</span>
              <span className="text-sm text-muted-foreground line-through">{inr(product.mrp)}</span>
              <span className="bg-accent px-2 py-1 text-[10px] font-bold tracking-[0.18em] text-accent-foreground">
                {discount(product)}% OFF
              </span>
            </div>
            <p className="mt-2 text-[11px] font-bold tracking-[0.2em] text-muted-foreground">
              IN STOCK · INCL. OF ALL TAXES
            </p>

            <p className="mt-8 text-sm text-muted-foreground">{product.description}</p>

            <div className="mt-8">
              <p className="eyebrow">COLOUR — {colour}</p>
              <div className="mt-3 flex gap-2">
                {product.colours.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColour(c)}
                    className={`border px-4 py-2 text-[11px] font-semibold tracking-wide ${
                      colour === c ? "border-foreground" : "border-border text-muted-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-7">
              <div className="flex items-center justify-between">
                <p className="eyebrow">SIZE</p>
                <span className="text-[10px] tracking-[0.18em] text-muted-foreground underline">
                  SIZE GUIDE
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSize(s);
                      setErr(false);
                    }}
                    className={`h-11 w-11 border text-[12px] font-bold transition-colors ${
                      size === s
                        ? "border-foreground bg-primary text-primary-foreground"
                        : "border-border hover:border-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {err && <p className="mt-2 text-[11px] text-accent">Please select a size.</p>}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={addToCart}
                className="flex-1 border border-foreground py-4 text-[11px] font-bold tracking-[0.28em] transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                ADD TO CART
              </button>
              <Link
                to="/checkout"
                onClick={(e) => {
                  if (!size) {
                    e.preventDefault();
                    setErr(true);
                    return;
                  }
                  cart.add(product.slug, size);
                  cart.setOpen(false);
                }}
                className="flex-1 bg-primary py-4 text-center text-[11px] font-bold tracking-[0.28em] text-primary-foreground transition-colors hover:bg-accent"
              >
                BUY NOW
              </Link>
            </div>

            <ul className="mt-8 space-y-2 border-t border-border pt-6 text-[12px] text-muted-foreground">
              <li>COD available across India.</li>
              <li>Dispatched in 24–48 hours · Free shipping above ₹999.</li>
              <li>7-day easy exchange on unused items with tags.</li>
            </ul>

            <div className="mt-8 border-t border-border pt-6">
              <p className="eyebrow">REVIEWS — 4.8 / 5</p>
              <div className="mt-4 space-y-4 text-sm">
                <p className="text-muted-foreground">
                  “Fabric quality is top-notch and the fit is exactly as shown.” — Vivek J.
                </p>
                <p className="text-muted-foreground">
                  “Delivered in two days, packaging felt premium.” — Rohan S.
                </p>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-24">
          <h2 className="text-2xl">YOU MAY ALSO LIKE</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {products
              .filter((p) => p.slug !== product.slug)
              .slice(0, 4)
              .map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
          </div>
        </section>
      </main>
      <Footer />
      <MobileBar />
    </>
  );
}
