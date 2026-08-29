import { Link } from "react-router-dom";
import { Heart, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { money } from "@/services/ecommerceServices";
import type { ProductSummary } from "@/types/ecommerce.type";

const placeholder =
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80";

type ProductCardProps = {
  product: ProductSummary;
  badge?: string;
  className?: string;
};

export function ProductCard({ product, badge = "NEW", className = "" }: ProductCardProps) {
  const hasDiscount =
    product.compareAtPrice != null &&
    product.minPrice != null &&
    product.compareAtPrice > product.minPrice;

  return (
    <Link
      to={`/products/${product.slug || product.productId}`}
      className={`group overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_4px_20px_rgba(0,0,0,.05)] transition hover:shadow-[0_10px_30px_rgba(0,0,0,.10)] ${className}`}
    >
      <div className="relative aspect-square overflow-hidden bg-[#F1F1EF]">
        {badge ? (
          <Badge className="absolute left-3 top-3 z-10 rounded-md bg-[#111111] text-white">{badge}</Badge>
        ) : null}
        <button
          type="button"
          className="absolute right-3 top-3 z-10 rounded-full bg-white p-2 shadow-sm"
          aria-label="Wishlist"
          onClick={(event) => event.preventDefault()}
        >
          <Heart className="h-4 w-4" />
        </button>
        <img
          src={product.imageUrls?.[0] || placeholder}
          alt={product.name}
          className="h-full w-full object-contain p-5 transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <p className="text-xs font-bold uppercase text-[#6B7280]">{product.brandName || "SOLE"}</p>
        <h2 className="mt-1 line-clamp-2 text-base font-bold">{product.name}</h2>
        <p className="mt-1 line-clamp-1 text-sm text-[#6B7280]">
          {product.shortDescription || "Sneaker essentials"}
        </p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-sm font-bold">{money(product.minPrice ?? 0)}</span>
            {hasDiscount ? (
              <span className="ml-2 text-xs text-[#9CA3AF] line-through">
                {money(product.compareAtPrice!)}
              </span>
            ) : null}
          </div>
          <span className="shrink-0 rounded-full bg-[#111111] p-2 text-white">
            <Plus className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
