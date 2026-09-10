/**
 * Centralised image URL helper.
 *
 * Images live in cloud storage and are referenced in the database by a full,
 * absolute storage URL that any browser can load directly — no server route,
 * no runtime env vars — so they work on every deployment target.
 * Legacy records that still hold a bare storage path keep working through the
 * app's own /api/public/img/* route.
 */
export function imageUrl(path?: string | null): string {
  if (!path) return FALLBACK_IMAGE;
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:")) return path;
  const clean = path.replace(/^\/+/, "");
  return `/api/public/img/${clean.split("/").map(encodeURIComponent).join("/")}`;
}

/** Ten years — storage links stored in the database must not expire. */
const LONG_LIVED_SECONDS = 315_360_000;

/**
 * Turn a freshly uploaded storage path into an absolute, long-lived URL that
 * is safe to persist in the database and load from any deployed domain.
 */
export async function storageUrl(
  client: {
    storage: {
      from: (b: string) => {
        createSignedUrl: (
          p: string,
          e: number,
        ) => Promise<{ data: { signedUrl: string } | null; error: unknown }>;
      };
    };
  },
  path: string,
): Promise<string> {
  const { data } = await client.storage
    .from("product-images")
    .createSignedUrl(path, LONG_LIVED_SECONDS);
  return data?.signedUrl ?? path;
}

/** Inline neutral placeholder so a missing image never breaks the layout. */
export const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"><rect width="800" height="1000" fill="#e9e6e1"/><text x="400" y="510" font-family="sans-serif" font-size="34" letter-spacing="10" text-anchor="middle" fill="#9a938a">11:11</text></svg>`,
  );

/** Attach to any <img> to swap in the placeholder if the file is unavailable. */
export function onImageError(e: React.SyntheticEvent<HTMLImageElement>) {
  const el = e.currentTarget;
  if (el.dataset["fallback"] === "1") return;
  el.dataset["fallback"] = "1";
  el.src = FALLBACK_IMAGE;
}
