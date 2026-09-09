import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { homepageQuery } from "@/lib/store";

const KEY = "1111-offer-dismissed";

export function OfferPopup() {
  const { data } = useQuery(homepageQuery());
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(KEY)) return;
    const t = setTimeout(() => setOpen(true), 9000);
    return () => clearTimeout(t);
  }, []);

  const close = () => {
    localStorage.setItem(KEY, "1");
    setOpen(false);
  };

  if (!open || !data || !data.offer_active) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-ink/60 px-4 backdrop-blur-sm fadein">
      <div className="relative w-full max-w-md border border-border bg-background px-8 py-10 text-center">
        <button
          onClick={close}
          className="absolute right-4 top-3 text-[11px] tracking-[0.2em] text-muted-foreground hover:text-accent"
        >
          CLOSE
        </button>
        {done ? (
          <>
            <h3 className="text-2xl">CODE {data.offer_code}</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Apply it at checkout for {data.offer_percent}% off your first order.
            </p>
          </>
        ) : (
          <>
            <p className="eyebrow text-accent">FIRST ORDER</p>
            <h3 className="mt-3 text-3xl leading-none">{data.offer_title}</h3>
            <p className="mt-3 text-sm text-muted-foreground">{data.offer_description}</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                localStorage.setItem(KEY, "1");
                setDone(true);
              }}
              className="mt-6 space-y-3"
            >
              <input
                required
                placeholder="Enter your email / mobile"
                className="w-full border border-input bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground"
              />
              <button className="w-full bg-primary py-3.5 text-[11px] font-bold tracking-[0.28em] text-primary-foreground transition-colors hover:bg-accent">
                UNLOCK MY OFFER
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
