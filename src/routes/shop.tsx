import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AnnouncementBar, Footer, Header, MobileBar } from "@/components/SiteChrome";
import { ProductCard } from "@/components/ProductCard";
import { fits, products } from "@/lib/products";

type Search = { fit?: string; q?: string };

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    fit: typeof search.fit === "string" ? search.fit : undefined,
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop All — 11:11 STORE Men's Fashion" },
      {
        name: "description",
        content:
          "Browse oversized tees, jerseys and vests at 11:11 STORE. Filter by fit, size, colour and price.",
      },
      { property: "og:title", content: "Shop All — 11:11 STORE" },
      { property: "og:description", content: "Oversized tees, jerseys and vests for everyday." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { fit, q } = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const [size, setSize] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState(1500);
  const [sort, setSort] = useState("featured");

  const list = useMemo(() => {
    let out = products.filter(
      (p) =>
        (!fit || p.fit === fit) &&
        (!size || p.sizes.includes(size)) &&
        p.price <= maxPrice &&
        (!q || p.name.toLowerCase().includes(q.toLowerCase())),
    );
    if (sort === "low") out = [...out].sort((a, b) => a.price - b.price);
    if (sort === "high") out = [...out].sort((a, b) => b.price - a.price);
    return out;
  }, [fit, size, maxPrice, q, sort]);

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main className="mx-auto max-w-[1400px] px-5 pb-28 pt-10 md:px-10">
        <h1 className="text-[clamp(2.5rem,7vw,5rem)] leading-none">SHOP ALL</h1>

        <div className="mt-8 flex flex-wrap items-center gap-3 border-y border-border py-4">
          <input
            defaultValue={q ?? ""}
            placeholder="Search"
            onChange={(e) => navigate({ search: (s) => ({ ...s, q: e.target.value || undefined }) })}
            className="border border-input bg-transparent px-3 py-2 text-xs outline-none focus:border-foreground"
          />
          <div className="flex flex-wrap gap-2">
            {["ALL", ...fits].map((f) => {
              const active = f === "ALL" ? !fit : fit === f;
              return (
                <button
                  key={f}
                  onClick={() =>
                    navigate({ search: (s) => ({ ...s, fit: f === "ALL" ? undefined : f }) })
                  }
                  className={`border px-3 py-2 text-[10px] font-bold tracking-[0.18em] transition-colors ${
                    active
                      ? "border-foreground bg-primary text-primary-foreground"
                      : "border-border hover:border-foreground"
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            {["S", "M", "L", "XL"].map((s) => (
              <button
                key={s}
                onClick={() => setSize(size === s ? null : s)}
                className={`h-9 w-9 border text-[11px] font-bold transition-colors ${
                  size === s
                    ? "border-foreground bg-primary text-primary-foreground"
                    : "border-border hover:border-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-[10px] font-bold tracking-[0.18em]">
            UPTO ₹{maxPrice}
            <input
              type="range"
              min={500}
              max={1500}
              step={50}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="accent-[oklch(0.55_0.203_28)]"
            />
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="ml-auto border border-input bg-transparent px-3 py-2 text-[10px] font-bold tracking-[0.18em]"
          >
            <option value="featured">SORT: FEATURED</option>
            <option value="low">PRICE: LOW TO HIGH</option>
            <option value="high">PRICE: HIGH TO LOW</option>
          </select>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-4">
          {list.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
        {list.length === 0 && (
          <p className="py-20 text-center text-sm text-muted-foreground">
            No products match these filters.
          </p>
        )}
      </main>
      <Footer />
      <MobileBar />
    </>
  );
}
