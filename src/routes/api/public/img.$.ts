import { createFileRoute } from "@tanstack/react-router";

/**
 * Public, cacheable image proxy for product photos held in cloud storage.
 * Read-only: it only streams objects out of the product-images bucket.
 */
export const Route = createFileRoute("/api/public/img/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const raw = (params as Record<string, string>)["_splat"] ?? "";
        const path = raw
          .split("/")
          .map((s) => decodeURIComponent(s))
          .filter((s) => s && s !== "." && s !== "..")
          .join("/");

        if (!path) return new Response("Not found", { status: 404 });

        // Public read is allowed on this bucket, so the publishable key is enough.
        // Falls back to the privileged client if that ever fails.
        const { createClient } = await import("@supabase/supabase-js");
        const publicClient = createClient(
          process.env["SUPABASE_URL"]!,
          process.env["SUPABASE_PUBLISHABLE_KEY"]!,
          { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
        );

        let data: Blob | null = null;
        const first = await publicClient.storage.from("product-images").download(path);
        data = first.data;

        if (!data) {
          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const second = await supabaseAdmin.storage.from("product-images").download(path);
            data = second.data;
          } catch {
            data = null;
          }
        }

        if (!data) return new Response("Not found", { status: 404 });

        return new Response(await data.arrayBuffer(), {
          headers: {
            "content-type": data.type || "image/jpeg",
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
