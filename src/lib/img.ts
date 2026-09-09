/**
 * Centralised image URL helper.
 *
 * Product images are stored in cloud storage and referenced by their storage
 * path (e.g. "seed/photo.jpg"). They are served through the app's own
 * /api/public/img/* route so the URL is production-safe on any host.
 * Absolute URLs are passed through untouched.
 */
export function imageUrl(path?: string | null): string {
  if (!path) return FALLBACK_IMAGE;
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:")) return path;
  const clean = path.replace(/^\/+/, "");
  return `/api/public/img/${clean.split("/").map(encodeURIComponent).join("/")}`;
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
