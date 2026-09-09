import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/lib/cart";
import { homepageQuery } from "@/lib/store";

export function AnnouncementBar() {
  const { data } = useQuery(homepageQuery());
  return (
    <div className="bg-ink py-2 text-center text-[10px] font-semibold tracking-[0.26em] text-primary-foreground">
      {data?.announcement ?? "NEW DROP IS LIVE  •  FREE SHIPPING ABOVE ₹999"}
    </div>
  );
}

export function Header({ overlay = false }: { overlay?: boolean }) {
  const cart = useCart();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = !overlay || scrolled;

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-500 ${
        solid ? "bg-background/85 backdrop-blur-md border-b border-border" : "bg-transparent"
      }`}
    >
      <nav
        className={`mx-auto flex max-w-[1400px] items-center justify-between px-5 py-4 md:px-10 ${
          solid ? "text-foreground" : "text-primary-foreground"
        }`}
      >
        <Link to="/" className="display text-xl leading-none tracking-[0.02em]">
          11:11 <span className="font-sans text-[11px] font-bold tracking-[0.3em]">STORE</span>
        </Link>
        <div className="hidden gap-8 text-[11px] font-semibold tracking-[0.22em] md:flex">
          <Link to="/shop" className="hover:text-accent">
            SHOP
          </Link>
          <Link to="/shop" search={{ fit: "OVERSIZED" }} className="hover:text-accent">
            NEW DROP
          </Link>
          <Link to="/" hash="story" className="hover:text-accent">
            STORY
          </Link>
        </div>
        <button
          onClick={() => cart.setOpen(true)}
          className="text-[11px] font-semibold tracking-[0.22em] hover:text-accent"
        >
          BAG ({cart.count})
        </button>
      </nav>
    </header>
  );
}

export function MobileBar() {
  const cart = useCart();
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-border bg-background/95 backdrop-blur md:hidden">
      <Link to="/shop" className="py-4 text-center text-[11px] font-bold tracking-[0.26em]">
        SHOP
      </Link>
      <button
        onClick={() => cart.setOpen(true)}
        className="bg-primary py-4 text-center text-[11px] font-bold tracking-[0.26em] text-primary-foreground"
      >
        BAG ({cart.count})
      </button>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-ink px-5 py-14 text-primary-foreground md:px-10">
      <div className="mx-auto flex max-w-[1400px] flex-col justify-between gap-8 md:flex-row">
        <div>
          <p className="display text-4xl leading-none">11:11 STORE</p>
          <p className="mt-3 max-w-xs text-sm text-primary-foreground/60">
            Affordable lifestyle & everyday finds. Chh. Sambhaji Nagar, India.
          </p>
        </div>
        <div className="text-[11px] tracking-[0.22em] text-primary-foreground/70">
          <p>COD AVAILABLE</p>
          <p className="mt-2">EASY EXCHANGE</p>
          <p className="mt-2">SECURE CHECKOUT</p>
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-[1400px] flex-col gap-2 text-[10px] tracking-[0.24em] text-primary-foreground/40 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} 11:11 STORE</p>
        <p className="tracking-[0.2em]">Developed by Ritesh Pawar</p>
      </div>
    </footer>
  );
}
