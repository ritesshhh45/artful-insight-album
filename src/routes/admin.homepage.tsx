import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { btn, card, h1, input, label } from "@/lib/admin-ui";
import { imageUrl, onImageError } from "@/lib/img";
import { homepageQuery, productsQuery, type Homepage } from "@/lib/store";

export const Route = createFileRoute("/admin/homepage")({ component: HomepageAdmin });

function HomepageAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery(homepageQuery());
  const { data: products = [] } = useQuery(productsQuery(true));
  const [form, setForm] = useState<Homepage | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (data && !form) setForm(data);
  }, [data, form]);

  const save = useMutation({
    mutationFn: async (value: Homepage) => {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key: "homepage", value }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      setMsg("Homepage updated.");
      void qc.invalidateQueries({ queryKey: ["homepage"] });
    },
    onError: (e: Error) => setMsg(e.message),
  });

  const uploadHero = async (file?: File) => {
    if (!file || !form) return;
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `homepage/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file, { contentType: file.type });
    setUploading(false);
    if (error) return setMsg(`Upload failed: ${error.message}`);
    setForm({ ...form, hero_image: await storageUrl(supabase, path) });
  };

  if (!form) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const field = (key: keyof Homepage, title: string, type = "text") => (
    <div>
      <p className={label}>{title}</p>
      <input
        type={type}
        className={input}
        value={String(form[key] ?? "")}
        onChange={(e) =>
          setForm({
            ...form,
            [key]: type === "number" ? Number(e.target.value) : e.target.value,
          })
        }
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className={h1}>HOMEPAGE</h1>
        <button className={btn} disabled={save.isPending} onClick={() => save.mutate(form)}>
          {save.isPending ? "SAVING…" : "SAVE CHANGES"}
        </button>
      </div>
      {msg && <p className="text-[12px] text-accent">{msg}</p>}

      <div className={card}>
        <p className="text-[11px] font-bold tracking-[0.2em]">ANNOUNCEMENT BAR</p>
        <div className="mt-4">{field("announcement", "TEXT")}</div>
      </div>

      <div className={card}>
        <p className="text-[11px] font-bold tracking-[0.2em]">HERO</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {field("hero_eyebrow", "EYEBROW")}
          <div>
            <p className={label}>TITLE (use a new line for the break)</p>
            <textarea
              rows={2}
              className={input}
              value={form.hero_title}
              onChange={(e) => setForm({ ...form, hero_title: e.target.value })}
            />
          </div>
          {field("hero_subtitle", "SUBTITLE")}
          {field("cta_text", "BUTTON TEXT")}
          {field("cta_link", "BUTTON LINK")}
          <div>
            <p className={label}>HERO IMAGE</p>
            <img
              src={imageUrl(form.hero_image)}
              onError={onImageError}
              alt="Hero"
              className="mt-2 h-28 w-24 object-cover"
            />
            <input
              type="file"
              accept="image/*"
              className="mt-2 text-xs"
              onChange={(e) => void uploadHero(e.target.files?.[0])}
            />
            {uploading && <p className="mt-1 text-[11px] text-accent">Uploading…</p>}
          </div>
        </div>
      </div>

      <div className={card}>
        <p className="text-[11px] font-bold tracking-[0.2em]">FIRST-ORDER OFFER POPUP</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {field("offer_title", "TITLE")}
          {field("offer_description", "DESCRIPTION")}
          {field("offer_code", "COUPON CODE")}
          {field("offer_percent", "PERCENT", "number")}
          <label className="flex items-center gap-2 text-[12px]">
            <input
              type="checkbox"
              checked={form.offer_active}
              onChange={(e) => setForm({ ...form, offer_active: e.target.checked })}
            />
            Show the popup
          </label>
        </div>
      </div>

      <div className={card}>
        <p className="text-[11px] font-bold tracking-[0.2em]">NEW DROP & FEATURED</p>
        <p className="mt-3 text-[12px] text-muted-foreground">
          The homepage shows products marked “New arrival” in the drop grid and the product marked
          “Featured” in the big feature block. Change those toggles on the Products page.
        </p>
        <div className="mt-4 space-y-1 text-[12px]">
          {products
            .filter((p) => p.is_featured || p.is_new_arrival)
            .map((p) => (
              <p key={p.id}>
                {p.name} —{" "}
                <span className="text-muted-foreground">
                  {[p.is_featured ? "featured" : null, p.is_new_arrival ? "new arrival" : null]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </p>
            ))}
        </div>
      </div>
    </div>
  );
}
