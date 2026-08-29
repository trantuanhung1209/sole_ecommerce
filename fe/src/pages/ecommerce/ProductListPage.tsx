import { useEffect, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/home/ProductCard";
import { TablePagination } from "@/components/shared/TablePagination";
import { productApi } from "@/services/ecommerceServices";
import type { ProductSummary } from "@/types/ecommerce.type";

const PAGE_SIZE = 12;

export default function ProductListPage() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    productApi
      .list(search || undefined, page, PAGE_SIZE)
      .then((result) => {
        setProducts(result.content);
        setTotalPages(result.totalPages);
        setTotalElements(result.totalElements);
      })
      .finally(() => setLoading(false));
  }, [search, page]);

  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111]">
      <section className="mx-auto max-w-[1240px] px-4 py-8 md:px-5 md:py-12">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#E53935]">Cửa hàng giày cao cấp</p>
            <h1 className="mt-2 text-4xl font-bold md:text-5xl">Bộ sưu tập giày</h1>
            <p className="mt-3 max-w-xl text-sm text-[#6B7280] md:text-base">
              Tìm giày theo style, size và màu.
              {totalElements > 0 ? ` ${totalElements} sản phẩm đang bán.` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[#9CA3AF]" />
              <Input
                className="h-11 rounded-lg bg-white pl-9"
                placeholder="Tìm giày..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Button variant="outline" className="h-11 border-[#D1D5DB] bg-white text-[#111111]">
              <SlidersHorizontal className="h-4 w-4" />
              Lọc
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square rounded-xl bg-[#F1F1EF]" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-10 text-center">
            <h2 className="text-2xl font-bold">Chưa có sản phẩm</h2>
            <p className="mt-2 text-[#6B7280]">
              Khởi động backend — dữ liệu demo sẽ tự seed khi database trống.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
              {products.map((product) => (
                <ProductCard key={product.productId} product={product} />
              ))}
            </div>
            <TablePagination
              page={page}
              totalPages={totalPages}
              totalElements={totalElements}
              onPageChange={setPage}
              className="mt-8"
            />
          </>
        )}
      </section>
    </main>
  );
}
