import { Link } from "@tanstack/react-router";
import { discount, inr, stockFor, totalStock, type Product } from "@/lib/store";
import { imageUrl, onImageError } from "@/lib/img";
import { useCart } from "@/lib/cart";

export function ProductCard({ product }: { product: Product }) {
  const cart = useCart();
  const off = discount(product);
  const soldOut = (product.product_stock?.length ?? 0) > 0 && totalStock(product) === 0;
  const quickSize =
    product.sizes.find((s) => stockFor(product, s) > 0) ?? product.sizes[0] ?? "M";

  return (
    <div className="group">
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="relative block overflow-hidden bg-secondary"
      >
        <img
          src={imageUrl(product.images[0])}
          onError={onImageError}
          alt={product.name}
          loading="lazy"
          className="aspect-[4/5] w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.06]"
        />
        {off > 0 && !soldOut && (
          <span className="absolute left-0 top-0 bg-accent px-2.5 py-1 text-[10px] font-bold tracking-[0.18em] text-accent-foreground">
            {off}% OFF
          </span>
        )}
        {soldOut ? (
          <span className="absolute inset-x-0 bottom-0 bg-ink/80 py-3 text-center text-[11px] font-bold tracking-[0.24em] text-primary-foreground">
            OUT OF STOCK
          </span>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              cart.add(product, quickSize);
            }}
            className="absolute inset-x-0 bottom-0 translate-y-full bg-primary py-3 text-[11px] font-bold tracking-[0.24em] text-primary-foreground transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-y-0"
          >
            QUICK ADD
          </button>
        )}
      </Link>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <Link
            to="/product/$slug"
            params={{ slug: product.slug }}
            className="text-[13px] font-semibold tracking-wide hover:text-accent"
          >
            {product.name}
          </Link>
          <p className="mt-0.5 text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
            {product.fit}
          </p>
        </div>
        <div className="whitespace-nowrap text-right">
          <span className="text-[13px] font-bold">{inr(product.price)}</span>
          {product.mrp > product.price && (
            <span className="ml-1.5 text-[11px] text-muted-foreground line-through">
              {inr(product.mrp)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
