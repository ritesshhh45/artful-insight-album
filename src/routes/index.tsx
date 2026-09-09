import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AnnouncementBar, Footer, Header, MobileBar } from "@/components/SiteChrome";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { OfferPopup } from "@/components/OfferPopup";
import { imageUrl, onImageError } from "@/lib/img";
import { discount, FITS, homepageQuery, inr, productsQuery } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "11:11 STORE — Wear Your Moment | Men's Fashion" },
      {
        name: "description",
        content:
          "Premium everyday men's fashion. Oversized tees, jerseys and denim from 11:11 STORE. COD available, free shipping above ₹999.",
      },
      { property: "og:title", content: "11:11 STORE — Wear Your Moment" },
      {
        property: "og:description",
        content: "Modern men's fashion. Made for your everyday. Shop the new drop.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: products = [] } = useQuery(productsQuery());
  const { data: home } = useQuery(homepageQuery());

  const newDrop = products.filter((p) => p.is_new_arrival);
  const drop = (newDrop.length ? newDrop : products).slice(0, 4);
  const featured = products.find((p) => p.is_featured) ?? products[0];
  const heroSrc = imageUrl(home?.hero_image || featured?.images[0]);

  return (
    <>
      <AnnouncementBar />
      <Header overlay />

      {/* HERO */}
      <section className="relative -mt-[57px] h-dvh w-full overflow-hidden bg-ink">
        <img
          src={heroSrc}
          onError={onImageError}
          alt="11:11 STORE campaign"
          className="kenburns absolute inset-0 h-full w-full object-cover object-[62%_center] md:object-[center_20%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-ink/45" />
        <div className="relative z-10 flex h-full flex-col justify-end px-5 pb-24 text-primary-foreground md:px-10 md:pb-20">
          <p className="rise eyebrow" style={{ animationDelay: "0.2s" }}>
            {home?.hero_eyebrow ?? "11:11 STORE"}
          </p>
          <h1
            className="rise mt-4 whitespace-pre-line text-[clamp(3rem,12vw,10rem)] leading-[0.85]"
            style={{ animationDelay: "0.4s" }}
          >
            {home?.hero_title ?? "WEAR YOUR\nMOMENT."}
          </h1>
          <p
            className="rise mt-5 max-w-sm text-sm text-primary-foreground/75"
            style={{ animationDelay: "0.65s" }}
          >
            {home?.hero_subtitle ?? "Modern men's fashion. Made for your everyday."}
          </p>
          <div className="rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: "0.85s" }}>
            <Link
              to={(home?.cta_link as "/shop") ?? "/shop"}
              className="bg-background px-9 py-4 text-[11px] font-bold tracking-[0.28em] text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {home?.cta_text ?? "SHOP NOW"}
            </Link>
            <Link
              to="/shop"
              search={{ fit: "OVERSIZED" }}
              className="border border-primary-foreground/50 px-9 py-4 text-[11px] font-bold tracking-[0.28em] transition-colors hover:bg-primary-foreground hover:text-foreground"
            >
              EXPLORE NEW DROP
            </Link>
          </div>
        </div>
      </section>

      {/* NEW DROP */}
      <section className="px-5 py-20 md:px-10 md:py-28">
        <Reveal className="mx-auto max-w-[1400px]">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
            <div>
              <p className="eyebrow text-accent">NEW DROP</p>
              <h2 className="mt-3 text-[clamp(2rem,5vw,4rem)] leading-none">
                Designed for the
                <br />
                way you move.
              </h2>
            </div>
            <Link to="/shop" className="eyebrow border-b border-foreground pb-1 hover:text-accent">
              VIEW ALL
            </Link>
          </div>
        </Reveal>
        <div className="mx-auto mt-10 grid max-w-[1400px] grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {drop.map((p, i) => (
            <Reveal key={p.id} delay={i * 90}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      {featured && (
        <section className="grid items-stretch md:grid-cols-2">
          <img
            src={imageUrl(featured.images[0])}
            onError={onImageError}
            alt={featured.name}
            className="h-full max-h-[85vh] w-full object-cover"
          />
          <div className="flex flex-col justify-center bg-ink px-6 py-16 text-primary-foreground md:px-16">
            <Reveal>
              <p className="eyebrow text-accent">FEATURED</p>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3.5rem)] leading-[0.95]">{featured.name}</h2>
              <div className="mt-6 flex items-baseline gap-3">
                <span className="text-2xl font-bold">{inr(featured.price)}</span>
                <span className="text-sm text-primary-foreground/50 line-through">
                  {inr(featured.mrp)}
                </span>
                {discount(featured) > 0 && (
                  <span className="bg-accent px-2 py-1 text-[10px] font-bold tracking-[0.18em]">
                    {discount(featured)}% OFF
                  </span>
                )}
              </div>
              <p className="mt-6 max-w-md text-sm text-primary-foreground/65">
                {featured.description}
              </p>
              <Link
                to="/product/$slug"
                params={{ slug: featured.slug }}
                className="mt-9 inline-block bg-background px-10 py-4 text-[11px] font-bold tracking-[0.28em] text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                SHOP NOW
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* SHOP BY FIT */}
      <section className="px-5 py-20 md:px-10 md:py-28">
        <Reveal className="mx-auto max-w-[1400px]">
          <p className="eyebrow text-accent">SHOP BY FIT</p>
          <h2 className="mt-3 text-[clamp(2rem,5vw,4rem)] leading-none">Find your silhouette.</h2>
        </Reveal>
        <div className="mx-auto mt-10 grid max-w-[1400px] grid-cols-2 gap-3 lg:grid-cols-4">
          {FITS.map((fit, i) => {
            const pic = products.find((p) => p.fit === fit) ?? products[i % (products.length || 1)];
            return (
              <Reveal key={fit} delay={i * 80}>
                <Link
                  to="/shop"
                  search={{ fit }}
                  className="group relative block overflow-hidden bg-secondary"
                >
                  <img
                    src={imageUrl(pic?.images[0])}
                    onError={onImageError}
                    alt={fit}
                    loading="lazy"
                    className="aspect-[3/4] w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-ink/35 transition-colors group-hover:bg-ink/15" />
                  <span className="absolute bottom-5 left-5 display text-2xl text-primary-foreground">
                    {fit}
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* COMPLETE THE FIT */}
      <section className="border-y border-border bg-secondary px-5 py-16 md:px-10">
        <Reveal className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-6">
          <div>
            <p className="eyebrow text-accent">COMPLETE THE FIT</p>
            <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm font-semibold tracking-wide">
              <li>Oversized Tee</li>
              <li>Straight Fit Denim</li>
              <li>Baggy Denim</li>
              <li>Utility Cargo</li>
            </ul>
          </div>
          <Link to="/shop" className="eyebrow border-b border-foreground pb-1 hover:text-accent">
            BUILD YOUR LOOK →
          </Link>
        </Reveal>
      </section>

      {/* WHY */}
      <section className="mx-auto grid max-w-[1400px] grid-cols-2 gap-x-6 gap-y-10 px-5 py-20 md:grid-cols-4 md:px-10">
        {[
          ["PREMIUM FITS", "Modern silhouettes."],
          ["COD AVAILABLE", "Convenient shopping."],
          ["SECURE CHECKOUT", "Safe payments."],
          ["EASY EXCHANGE", "Simple exchange experience."],
        ].map(([t, d], i) => (
          <Reveal key={t} delay={i * 80}>
            <p className="text-[13px] font-bold tracking-[0.2em]">{t}</p>
            <p className="mt-2 text-sm text-muted-foreground">{d}</p>
          </Reveal>
        ))}
      </section>

      {/* STORY */}
      <section id="story" className="relative overflow-hidden bg-ink">
        <img
          src={imageUrl(products[4]?.images[0] ?? products[0]?.images[0])}
          onError={onImageError}
          alt="11:11 STORE editorial"
          className="h-[80vh] w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-primary-foreground">
          <Reveal>
            <h2 className="text-[clamp(2.5rem,8vw,7rem)] leading-none">THE 11:11 MOMENT</h2>
            <p className="mx-auto mt-6 max-w-xl text-sm text-primary-foreground/75 md:text-base">
              “11:11 is a moment to make a wish, make a choice, and make it yours.”
            </p>
          </Reveal>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-24 text-center">
        <Reveal>
          <h2 className="text-[clamp(2.5rem,8vw,7rem)] leading-[0.9]">
            MAKE YOUR
            <br />
            11:11 MOMENT.
          </h2>
          <Link
            to="/shop"
            className="mt-10 inline-block bg-primary px-12 py-5 text-[11px] font-bold tracking-[0.3em] text-primary-foreground transition-colors hover:bg-accent"
          >
            SHOP THE COLLECTION
          </Link>
        </Reveal>
      </section>

      <Footer />
      <MobileBar />
      <OfferPopup />
    </>
  );
}
