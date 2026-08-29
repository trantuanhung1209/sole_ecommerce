import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AdminFilterBar } from "@/components/shared/AdminFilterBar";
import { productApi, reviewApi } from "@/services/ecommerceServices";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { TablePagination } from "@/components/shared/TablePagination";
import { useDebounce } from "@/hooks/useDebounce";
import {
  reviewRatingFilterOptions,
  reviewVisibilityFilterOptions,
} from "@/utils/adminFilterOptions";
import type { Product, ProductReview } from "@/types/ecommerce.type";

const PRODUCT_PAGE_SIZE = 12;
const REVIEW_PAGE_SIZE = 10;

export default function ReviewManagementPage() {
  const { access } = useRoleAccess();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [productPage, setProductPage] = useState(0);
  const [productTotalPages, setProductTotalPages] = useState(0);
  const [productTotalElements, setProductTotalElements] = useState(0);
  const [reviewPage, setReviewPage] = useState(0);
  const [reviewTotalPages, setReviewTotalPages] = useState(0);
  const [reviewTotalElements, setReviewTotalElements] = useState(0);
  const [productSearch, setProductSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("ALL");
  const [visibilityFilter, setVisibilityFilter] = useState("ALL");
  const debouncedProductSearch = useDebounce(productSearch, 300);

  const loadProducts = useCallback(async () => {
    try {
      const result = await productApi.adminList(debouncedProductSearch || undefined, productPage, PRODUCT_PAGE_SIZE);
      setProducts(result.content);
      setProductTotalPages(result.totalPages);
      setProductTotalElements(result.totalElements);
    } catch {
      toast.error("Không thể tải sản phẩm");
    }
  }, [debouncedProductSearch, productPage]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    setProductPage(0);
  }, [debouncedProductSearch]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      if (ratingFilter !== "ALL" && review.rating !== Number(ratingFilter)) return false;
      if (visibilityFilter === "VISIBLE" && !review.visible) return false;
      if (visibilityFilter === "HIDDEN" && review.visible) return false;
      return true;
    });
  }, [ratingFilter, reviews, visibilityFilter]);

  const loadReviews = useCallback(async (productId: string, page = 0) => {
    setSelectedProductId(productId);
    setReviewPage(page);
    try {
      const result = await reviewApi.listByProduct(productId, page, REVIEW_PAGE_SIZE);
      setReviews(result.content);
      setReviewTotalPages(result.totalPages);
      setReviewTotalElements(result.totalElements);
    } catch {
      toast.error("Không thể tải đánh giá");
    }
  }, []);

  const handleReply = async (reviewId: string) => {
    const reply = replies[reviewId];
    if (!reply || !selectedProductId) return;
    try {
      await reviewApi.adminReply(reviewId, reply);
      toast.success("Đã trả lời đánh giá");
      loadReviews(selectedProductId, reviewPage);
    } catch {
      toast.error("Không thể trả lời");
    }
  };

  const resetProductFilters = () => {
    setProductSearch("");
    setProductPage(0);
  };

  const resetReviewFilters = () => {
    setRatingFilter("ALL");
    setVisibilityFilter("ALL");
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Quản lý đánh giá</h1>

      <AdminFilterBar
        search={{
          value: productSearch,
          onChange: setProductSearch,
          placeholder: "Tìm sản phẩm để xem đánh giá...",
        }}
        onReset={resetProductFilters}
        onRefresh={loadProducts}
        resultText={`${productTotalElements} sản phẩm`}
      />

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {products.map((p) => (
            <Button
              key={p.productId}
              variant={selectedProductId === p.productId ? "default" : "outline"}
              size="sm"
              onClick={() => loadReviews(p.productId, 0)}
            >
              {p.name}
            </Button>
          ))}
        </div>
        <TablePagination
          page={productPage}
          totalPages={productTotalPages}
          onPageChange={setProductPage}
        />
      </div>

      {selectedProductId ? (
        <>
          <AdminFilterBar
            selects={[
              {
                id: "review-rating",
                label: "Số sao",
                value: ratingFilter,
                onChange: setRatingFilter,
                options: reviewRatingFilterOptions(),
              },
              {
                id: "review-visibility",
                label: "Hiển thị",
                value: visibilityFilter,
                onChange: setVisibilityFilter,
                options: reviewVisibilityFilterOptions(),
              },
            ]}
            onReset={resetReviewFilters}
            resultText={`${filteredReviews.length}/${reviewTotalElements} đánh giá trên trang hiện tại`}
          />

          <div className="space-y-3">
            {filteredReviews.length === 0 ? (
              <p className="rounded-lg border p-6 text-center text-muted-foreground">
                Không có đánh giá phù hợp bộ lọc.
              </p>
            ) : (
              filteredReviews.map((r) => (
                <div key={r.reviewId} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge>{r.rating}★</Badge>
                    <Badge variant="outline">{r.visible ? "Hiển thị" : "Ẩn"}</Badge>
                  </div>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-sm">{r.content}</p>
                  {(r.staffReply || r.adminReply) && (
                    <p className="text-sm text-muted-foreground">
                      Phản hồi: {r.staffReply || r.adminReply}
                    </p>
                  )}
                  {access.moderateReviews && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Trả lời..."
                        value={replies[r.reviewId] || ""}
                        onChange={(e) => setReplies({ ...replies, [r.reviewId]: e.target.value })}
                      />
                      <Button size="sm" onClick={() => handleReply(r.reviewId)}>
                        Gửi
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          reviewApi.adminVisibility(r.reviewId, !r.visible).then(() =>
                            loadReviews(selectedProductId, reviewPage)
                          )
                        }
                      >
                        {r.visible ? "Ẩn" : "Hiện"}
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
            <TablePagination
              page={reviewPage}
              totalPages={reviewTotalPages}
              totalElements={reviewTotalElements}
              onPageChange={(page) => loadReviews(selectedProductId, page)}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
