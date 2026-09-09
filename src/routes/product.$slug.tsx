import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnnouncementBar, Footer, Header, MobileBar } from "@/components/SiteChrome";
import { ProductCard } from "@/components/ProductCard";
import { imageUrl, onImageError } from "@/lib/img";
import { discount, fetchProduct, inr, productsQuery, stockFor, totalStock } from "@/lib/store";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => {
    const pretty = params.slug.replace(/-/g, " ").toUpperCase();
    return {
      meta: [
        { title: `${pretty} — 11:11 STORE` },
        {
          name: "description",
          content: `${pretty} from 11:11 STORE. Premium everyday men's fashion with COD and easy exchange.`,
        },
        { property: "og:title", content: `${pretty} — 11:11 STORE` },
        { property: "og:description", content: "Premium everyday men's fashion from 11:11 STORE." },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const cart = useCart();
  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProduct(slug),
  });
  const { data: all = [] } = useQuery(productsQuery());

  const [size, setSize] = useState<string | null>(null);
  const [colour, setColour] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (product) setColour(product.colours[0] ?? "");
  }, [product]);

  if (isLoading)
    return (
      <>
        <AnnouncementBar />
        <Header />
        <main className="mx-auto max-w-[1400px] px-5 py-32 text-center text-sm text-muted-foreground">
          Loading…
        </main>
      </>
    );

  if (!product)
    return (
      <>
        <AnnouncementBar />
        <Header />
        <main className="mx-auto max-w-[1400px] px-5 py-32 text-center">
          <h1 className="text-3xl">PRODUCT NOT FOUND</h1>
          <Link to="/shop" className="eyebrow mt-6 inline-block border-b border-foreground pb-1">
            BACK TO SHOP
          </Link>
        </main>
        <Footer />
      </>
    );

  const soldOut = totalStock(product) === 0;
  const sizeStock = size ? stockFor(product, size) : 0;

  const addToCart = () => {
    if (!size) return setErr("Please select a size.");
    if (stockFor(product, size) < 1) return setErr("That size is out of stock.");
    setErr(null);
    cart.add(product, size, colour);
  };

  const related = all.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="mx-auto max-w-[1400px] px-5 pb-28 pt-8 md:px-10">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="space-y-3">
            <img
              src={imageUrl(product.images[0])}
              onError={onImageError}
              alt={product.name}
              className="w-full bg-secondary object-cover"
            />
            {product.images.length > 1 && (
              <div className="grid grid-cols-3 gap-3">
                {product.images.slice(1, 4).map((img) => (
                  <img
                    key={img}
                    src={imageUrl(img)}
                    onError={onImageError}
                    alt={`${product.name} detail`}
                    loading="lazy"
                    className="aspect-square w-full object-cover"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="md:sticky md:top-24 md:h-fit">
            <p className="eyebrow text-accent">{product.category}</p>
            <h1 className="mt-3 text-[clamp(1.8rem,4vw,3rem)] leading-none">{product.name}</h1>
            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-2xl font-bold">{inr(product.price)}</span>
              {product.mrp > product.price && (
                <>
                  <span className="text-sm text-muted-foreground line-through">
                    {inr(product.mrp)}
                  </span>
                  <span className="bg-accent px-2 py-1 text-[10px] font-bold tracking-[0.18em] text-accent-foreground">
                    {discount(product)}% OFF
                  </span>
                </>
              )}
            </div>
            <p className="mt-2 text-[11px] font-bold tracking-[0.2em] text-muted-foreground">
              {soldOut ? "OUT OF STOCK" : "IN STOCK · INCL. OF ALL TAXES"}
            </p>

            <p className="mt-8 text-sm text-muted-foreground">{product.description}</p>

            {product.colours.length > 0 && (
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
            )}

            <div className="mt-7">
              <div className="flex items-center justify-between">
                <p className="eyebrow">SIZE</p>
                <span className="text-[10px] tracking-[0.18em] text-muted-foreground underline">
                  SIZE GUIDE
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.sizes.map((s) => {
                  const out = stockFor(product, s) < 1;
                  return (
                    <button
                      key={s}
                      disabled={out}
                      onClick={() => {
                        setSize(s);
                        setErr(null);
                      }}
                      className={`relative h-11 w-11 border text-[12px] font-bold transition-colors ${
                        size === s
                          ? "border-foreground bg-primary text-primary-foreground"
                          : "border-border hover:border-foreground"
                      } ${out ? "cursor-not-allowed text-muted-foreground/50 line-through" : ""}`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              {size && sizeStock > 0 && sizeStock <= 5 && (
                <p className="mt-2 text-[11px] text-accent">Only {sizeStock} left in {size}.</p>
              )}
              {err && <p className="mt-2 text-[11px] text-accent">{err}</p>}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={addToCart}
                disabled={soldOut}
                className="flex-1 border border-foreground py-4 text-[11px] font-bold tracking-[0.28em] transition-colors hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                {soldOut ? "OUT OF STOCK" : "ADD TO CART"}
              </button>
              <Link
                to="/checkout"
                onClick={(e) => {
                  if (!size || stockFor(product, size) < 1) {
                    e.preventDefault();
                    setErr(size ? "That size is out of stock." : "Please select a size.");
                    return;
                  }
                  cart.add(product, size, colour);
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

        {related.length > 0 && (
          <section className="mt-24">
            <h2 className="text-2xl">YOU MAY ALSO LIKE</h2>
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
      <MobileBar />
    </>
  );
}
