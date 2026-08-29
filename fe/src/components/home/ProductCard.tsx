import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Loader2, ShoppingCart } from "lucide-react";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { money, productApi } from "@/services/ecommerceServices";
import type { ProductSummary } from "@/types/ecommerce.type";

const placeholder =
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80";

type ProductCardProps = {
  product: ProductSummary;
  badge?: string;
  className?: string;
};

export function ProductCard({ product, badge = "NEW", className = "" }: ProductCardProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const productUrl = `/products/${product.slug || product.productId}`;

  const hasDiscount =
    product.compareAtPrice != null &&
    product.minPrice != null &&
    product.compareAtPrice > product.minPrice;

  const handleAddToCart = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (adding) return;

    setAdding(true);
    try {
      const variants = await productApi.variants(product.productId);
      const available = variants.find(
        (variant) => variant.status === "ACTIVE" && (variant.available ?? 0) > 0
      );

      if (!available) {
        toast.error("Sản phẩm đang hết hàng");
        return;
      }

      await addItem(available.variantId, 1, {
        imageUrl: product.imageUrls?.[0] || placeholder,
        sourceElement: imageRef.current,
      });
      toast.success("Đã thêm vào giỏ hàng");
    } catch {
      toast.error("Không thể thêm vào giỏ hàng");
    } finally {
      setAdding(false);
    }
  };

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_4px_20px_rgba(0,0,0,.05)] transition hover:shadow-[0_10px_30px_rgba(0,0,0,.10)] ${className}`}
    >
      <Link
        to={productUrl}
        className="block cursor-pointer text-inherit no-underline"
        aria-label={`Xem chi tiết ${product.name}`}
      >
        <div className="relative aspect-square overflow-hidden bg-[#F1F1EF]">
          {badge ? (
            <Badge className="absolute left-3 top-3 z-[1] rounded-md bg-[#111111] text-white">{badge}</Badge>
          ) : null}
          <img
            ref={imageRef}
            src={product.imageUrls?.[0] || placeholder}
            alt={product.name}
            className="h-full w-full object-contain p-5 transition duration-300 group-hover:scale-105"
          />
        </div>

        <div className="p-4 pr-12">
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
          </div>
        </div>
      </Link>

      <button
        type="button"
        className="absolute right-3 top-3 z-10 cursor-pointer rounded-full bg-white p-2 shadow-sm transition hover:scale-105"
        aria-label="Yêu thích"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <Heart className="h-4 w-4" />
      </button>

      <button
        type="button"
        aria-label="Thêm vào giỏ hàng"
        disabled={adding}
        onClick={handleAddToCart}
        className="absolute bottom-4 right-4 z-10 cursor-pointer rounded-full bg-[#111111] p-2 text-white transition hover:scale-105 hover:bg-[#222222] disabled:cursor-wait disabled:opacity-70"
      >
        {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
      </button>
    </article>
  );
}
