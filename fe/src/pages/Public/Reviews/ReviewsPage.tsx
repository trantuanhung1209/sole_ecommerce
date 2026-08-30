import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { StarRating } from "@/components/ecommerce/StarRating";
import { TablePagination } from "@/components/shared/TablePagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { productApi, reviewApi } from "@/services/ecommerceServices";
import { useDebounce } from "@/hooks/useDebounce";
import { reviewRatingFilterOptions, reviewSortFilterOptions } from "@/utils/adminFilterOptions";
import type { ProductSummary, PublicReviewItem } from "@/types/ecommerce.type";

const PAGE_SIZE = 12;

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<PublicReviewItem[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [summaryRating, setSummaryRating] = useState(0);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("ALL");
  const [productFilter, setProductFilter] = useState("ALL");
  const [sortFilter, setSortFilter] = useState("NEWEST");
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    productApi.list({ page: 0, pageSize: 100, sort: "newest" }).then((result) => setProducts(result.content));
    reviewApi.home(1).then((data) => setSummaryRating(data.averageRating)).catch(() => setSummaryRating(0));
  }, []);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const result = await reviewApi.list({
        page,
        size: PAGE_SIZE,
        search: debouncedSearch || undefined,
        rating: ratingFilter !== "ALL" ? Number(ratingFilter) : undefined,
        productId: productFilter !== "ALL" ? productFilter : undefined,
        sort: sortFilter,
      });
      setReviews(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch {
      setReviews([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, productFilter, ratingFilter, sortFilter]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, productFilter, ratingFilter, sortFilter]);

  const resetFilters = () => {
    setSearch("");
    setRatingFilter("ALL");
    setProductFilter("ALL");
    setSortFilter("NEWEST");
    setPage(0);
  };

  return (
    <main className="min-h-screen bg-[#F7F7F5] px-4 py-8 text-[#111111]">
      <section className="mx-auto max-w-[900px] space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#E53935]">Khách hàng nói gì</p>
          <h1 className="mt-1 text-4xl font-bold">Tất cả đánh giá</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#6B7280]">
            <span>{totalElements} đánh giá công khai</span>
            {summaryRating > 0 ? (
              <>
                <span>·</span>
                <span>Trung bình</span>
                <StarRating rating={summaryRating} size="sm" showValue />
              </>
            ) : null}
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-[#E5E7EB] bg-white p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tiêu đề hoặc nội dung..."
              className="pl-9"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Số sao</Label>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả sao" />
                </SelectTrigger>
                <SelectContent>
                  {reviewRatingFilterOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Sản phẩm</Label>
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả sản phẩm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả sản phẩm</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.productId} value={product.productId}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Sắp xếp</Label>
              <Select value={sortFilter} onValueChange={setSortFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  {reviewSortFilterOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Xóa bộ lọc
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-36 rounded-2xl bg-white" />
            ))
          ) : reviews.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#E5E7EB] bg-white p-10 text-center text-[#6B7280]">
              Không có đánh giá phù hợp bộ lọc.
            </p>
          ) : (
            reviews.map((review) => <ReviewCard key={review.reviewId} review={review} />)
          )}
        </div>

        <TablePagination
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          onPageChange={setPage}
        />
      </section>
    </main>
  );
}
