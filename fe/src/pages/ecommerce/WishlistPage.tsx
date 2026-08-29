import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { wishlistApi, productApi } from "@/services/ecommerceServices";
import type { Product } from "@/types/ecommerce.type";

export default function WishlistPage() {
  const [products, setProducts] = useState<Product[]>([]);

  const load = async () => {
    const items = await wishlistApi.list();
    const loaded = await Promise.all(items.map((item) => productApi.detail(item.productId)));
    setProducts(loaded);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  return (
    <main className="mx-auto max-w-[1240px] px-4 py-8">
      <h1 className="text-3xl font-bold">Wishlist</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {products.map((product) => (
          <div key={product.productId} className="rounded-lg border p-4">
            <div className="flex items-start justify-between">
              <div>
                <Link to={`/products/${product.slug}`} className="font-semibold hover:underline">
                  {product.name}
                </Link>
                <p className="text-sm text-muted-foreground">{product.slug}</p>
              </div>
              <Button
                size="icon"
                variant="outline"
                onClick={() => wishlistApi.remove(product.productId).then(load)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Button asChild className="mt-4 w-full" variant="outline">
              <Link to={`/products/${product.slug}`}>
                <Heart className="mr-2 h-4 w-4" /> Xem sản phẩm
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </main>
  );
}
