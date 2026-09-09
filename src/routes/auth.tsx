import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Store Login — 11:11 STORE" },
      { name: "description", content: "Sign in to the 11:11 STORE owner dashboard." },
      { property: "og:title", content: "Store Login — 11:11 STORE" },
      { property: "og:description", content: "Sign in to manage products, orders and offers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/admin" });
  }, [loading, session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const fn =
      mode === "in"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/admin` },
          });
    const { error } = await fn;
    setBusy(false);
    if (error) return setMsg(error.message);
    if (mode === "up") setMsg("Account created. You can sign in now.");
    else void navigate({ to: "/admin" });
  };

  const google = async () => {
    setMsg(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) return setMsg("Google sign-in failed. Please try again.");
    if (result.redirected) return;
    void navigate({ to: "/admin" });
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-secondary px-5 py-16">
      <div className="w-full max-w-md border border-border bg-background px-8 py-10">
        <Link to="/" className="display text-2xl leading-none">
          11:11 <span className="font-sans text-[10px] font-bold tracking-[0.3em]">STORE</span>
        </Link>
        <h1 className="mt-6 text-3xl leading-none">
          {mode === "in" ? "SIGN IN" : "CREATE ACCOUNT"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Store owner access to the admin dashboard.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full border border-input bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full border border-input bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground"
          />
          <button
            disabled={busy}
            className="w-full bg-primary py-3.5 text-[11px] font-bold tracking-[0.28em] text-primary-foreground transition-colors hover:bg-accent disabled:opacity-50"
          >
            {busy ? "PLEASE WAIT…" : mode === "in" ? "SIGN IN" : "SIGN UP"}
          </button>
        </form>

        <button
          onClick={google}
          className="mt-3 w-full border border-foreground py-3.5 text-[11px] font-bold tracking-[0.28em] transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          CONTINUE WITH GOOGLE
        </button>

        {msg && <p className="mt-4 text-[12px] text-accent">{msg}</p>}

        <button
          onClick={() => {
            setMode(mode === "in" ? "up" : "in");
            setMsg(null);
          }}
          className="mt-6 text-[11px] tracking-[0.18em] text-muted-foreground hover:text-accent"
        >
          {mode === "in" ? "NEED AN ACCOUNT? SIGN UP" : "ALREADY REGISTERED? SIGN IN"}
        </button>
      </div>
    </main>
  );
}
