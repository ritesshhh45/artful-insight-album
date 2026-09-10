import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { signOut, useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — 11:11 STORE" },
      { name: "description", content: "11:11 STORE owner dashboard." },
      { property: "og:title", content: "Admin — 11:11 STORE" },
      { property: "og:description", content: "Manage products, orders, stock and offers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/products", label: "Products", exact: false },
  { to: "/admin/categories", label: "Categories", exact: false },
  { to: "/admin/collections", label: "Collections", exact: false },
  { to: "/admin/orders", label: "Orders", exact: false },
  { to: "/admin/customers", label: "Customers", exact: false },
  { to: "/admin/inventory", label: "Inventory", exact: false },
  { to: "/admin/coupons", label: "Coupons", exact: false },
  { to: "/admin/homepage", label: "Homepage", exact: false },
  { to: "/admin/settings", label: "Settings", exact: false },
] as const;

function AdminLayout() {
  const { loading, session, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (!loading && !session) void navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  if (loading)
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );

  if (session && !isAdmin)
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-4xl">ACCESS DENIED</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This account is not authorised to manage 11:11 STORE.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => void signOut().then(() => navigate({ to: "/auth" }))}
            className="border border-foreground px-6 py-3 text-[11px] font-bold tracking-[0.22em]"
          >
            SIGN OUT
          </button>
          <Link
            to="/"
            className="bg-primary px-6 py-3 text-[11px] font-bold tracking-[0.22em] text-primary-foreground"
          >
            BACK TO STORE
          </Link>
        </div>
      </div>
    );

  if (!session) return null;

  return (
    <div className="min-h-dvh bg-secondary md:flex">
      <aside className="bg-ink text-primary-foreground md:sticky md:top-0 md:h-dvh md:w-60 md:shrink-0">
        <div className="flex items-center justify-between px-5 py-4 md:block">
          <Link to="/" className="display text-xl leading-none">
            11:11 <span className="font-sans text-[10px] font-bold tracking-[0.3em]">ADMIN</span>
          </Link>
          <button
            onClick={() => setMenu(!menu)}
            className="text-[11px] tracking-[0.2em] md:hidden"
            aria-label="Toggle navigation"
          >
            {menu ? "CLOSE" : "MENU"}
          </button>
        </div>
        <nav className={`${menu ? "block" : "hidden"} px-3 pb-5 md:block`}>
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.exact ?? false }}
              onClick={() => setMenu(false)}
              activeProps={{ className: "bg-primary-foreground/15 text-primary-foreground" }}
              className="block rounded-sm px-3 py-2.5 text-[11px] font-semibold tracking-[0.18em] text-primary-foreground/70 hover:text-primary-foreground"
            >
              {n.label.toUpperCase()}
            </Link>
          ))}
          <button
            onClick={() => void signOut().then(() => navigate({ to: "/auth" }))}
            className="mt-3 block w-full px-3 py-2.5 text-left text-[11px] font-semibold tracking-[0.18em] text-accent"
          >
            LOGOUT
          </button>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-10">
        <Outlet />
      </main>
    </div>
  );
}
