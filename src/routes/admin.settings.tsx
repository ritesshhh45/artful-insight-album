import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { btn, btnGhost, card, h1, input, label } from "@/lib/admin-ui";
import { signOut, useAuth } from "@/lib/auth";
import { FREE_SHIPPING, SHIPPING_FEE, inr } from "@/lib/store";

export const Route = createFileRoute("/admin/settings")({ component: Settings });

type Store = {
  store_name: string;
  support_email: string;
  support_phone: string;
  instagram: string;
};

const DEFAULTS: Store = {
  store_name: "11:11 STORE",
  support_email: "",
  support_phone: "",
  instagram: "the11.11storee_",
};

function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<Store | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["store-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "store")
        .maybeSingle();
      return { ...DEFAULTS, ...((data?.value as Partial<Store>) ?? {}) };
    },
  });

  useEffect(() => {
    if (data && !form) setForm(data);
  }, [data, form]);

  const save = useMutation({
    mutationFn: async (value: Store) => {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key: "store", value }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      setMsg("Settings saved.");
      void qc.invalidateQueries({ queryKey: ["store-settings"] });
    },
    onError: (e: Error) => setMsg(e.message),
  });

  if (!form) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className={h1}>SETTINGS</h1>
      {msg && <p className="text-[12px] text-accent">{msg}</p>}

      <div className={card}>
        <p className="text-[11px] font-bold tracking-[0.2em]">STORE DETAILS</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {(
            [
              ["store_name", "STORE NAME"],
              ["support_email", "SUPPORT EMAIL"],
              ["support_phone", "SUPPORT PHONE"],
              ["instagram", "INSTAGRAM HANDLE"],
            ] as const
          ).map(([k, t]) => (
            <div key={k}>
              <p className={label}>{t}</p>
              <input
                className={input}
                value={form[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <button className={`${btn} mt-5`} onClick={() => save.mutate(form)}>
          SAVE SETTINGS
        </button>
      </div>

      <div className={card}>
        <p className="text-[11px] font-bold tracking-[0.2em]">SHIPPING</p>
        <p className="mt-3 text-[12px] text-muted-foreground">
          Shipping is {inr(SHIPPING_FEE)} and free on orders above {inr(FREE_SHIPPING)}.
        </p>
      </div>

      <div className={card}>
        <p className="text-[11px] font-bold tracking-[0.2em]">ACCOUNT</p>
        <p className="mt-3 text-[12px] text-muted-foreground">Signed in as {user?.email}</p>
        <button
          className={`${btnGhost} mt-4`}
          onClick={() => void signOut().then(() => navigate({ to: "/auth" }))}
        >
          LOGOUT
        </button>
      </div>
    </div>
  );
}
