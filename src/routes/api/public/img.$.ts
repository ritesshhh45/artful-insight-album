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

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("product-images").download(path);

        if (error || !data) return new Response("Not found", { status: 404 });

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
