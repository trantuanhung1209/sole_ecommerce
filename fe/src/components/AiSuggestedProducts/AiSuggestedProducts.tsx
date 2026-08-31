import { Link } from "react-router-dom";
import { useState } from "react";
import { ImageIcon } from "lucide-react";
import type { AiSuggestedProduct } from "@/types/ai.type";

interface AiSuggestedProductsProps {
  products: AiSuggestedProduct[];
}

function ProductThumb({ product }: { product: AiSuggestedProduct }) {
  const [failed, setFailed] = useState(false);
  const imageUrl = product.imageUrl?.trim();

  if (!imageUrl || failed) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
        <ImageIcon className="h-4 w-4" aria-hidden />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={product.name}
      className="h-10 w-10 shrink-0 rounded object-cover"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default function AiSuggestedProducts({ products }: AiSuggestedProductsProps) {
  if (!products.length) {
    return null;
  }

  return (
    <div className="mt-2 space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Gợi ý sản phẩm</p>
      <div className="flex flex-col gap-2">
        {products.map((product) => (
          <Link
            key={product.productId}
            to={`/products/${product.slug}`}
            className="flex items-center gap-2 rounded-md border bg-background p-2 text-xs hover:bg-muted/50"
          >
            <ProductThumb product={product} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{product.name}</p>
              {product.minPrice != null && (
                <p className="text-muted-foreground">
                  {product.minPrice.toLocaleString("vi-VN")} đ
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
