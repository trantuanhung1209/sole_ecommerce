import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clampPage, paginateItems, TablePagination } from "@/components/shared/TablePagination";
import { useSmoothScroll } from "@/providers/SmoothScrollProvider";
import { wishlistApi, productApi } from "@/services/ecommerceServices";
import type { Product } from "@/types/ecommerce.type";

export const WISHLIST_PAGE_SIZE = 6;

export default function WishlistPage() {
  const { scrollToTop } = useSmoothScroll();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const items = await wishlistApi.list();
      const loaded = await Promise.all(items.map((item) => productApi.detail(item.productId)));
      setProducts(loaded);
      const nextTotalPages = Math.ceil(loaded.length / WISHLIST_PAGE_SIZE);
      setPage((prev) => clampPage(prev, nextTotalPages));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  const {
    items: pagedProducts,
    page: safePage,
    totalPages,
    totalElements,
  } = useMemo(() => paginateItems(products, page, WISHLIST_PAGE_SIZE), [products, page]);

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    scrollToTop();
  };

  const handleRemove = async (productId: string) => {
    await wishlistApi.remove(productId);
    await load();
  };

  return (
    <main className="mx-auto max-w-[1240px] px-4 py-8">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-3xl font-bold">Wishlist</h1>
        {totalElements > 0 ? (
          <p className="text-sm text-muted-foreground">{totalElements} sản phẩm yêu thích</p>
        ) : null}
      </div>

      {!loading && products.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-[#E5E7EB] bg-white p-8 text-center text-[#6B7280]">
          Danh sách yêu thích của bạn đang trống.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {pagedProducts.map((product) => (
            <div key={product.productId} className="rounded-lg border bg-white p-4">
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
                  aria-label={`Xóa ${product.name} khỏi wishlist`}
                  onClick={() => void handleRemove(product.productId)}
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
      )}

      <TablePagination
        page={safePage}
        totalPages={totalPages}
        totalElements={totalElements}
        onPageChange={handlePageChange}
        className="mt-6"
      />
    </main>
  );
}
