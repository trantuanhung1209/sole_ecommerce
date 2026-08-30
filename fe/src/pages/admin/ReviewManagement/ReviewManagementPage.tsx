import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminFilterBar } from "@/components/shared/AdminFilterBar";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { reviewApi } from "@/services/ecommerceServices";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { TablePagination } from "@/components/shared/TablePagination";
import { useDebounce } from "@/hooks/useDebounce";
import {
  reviewRatingFilterOptions,
  reviewSortFilterOptions,
  reviewVisibilityFilterOptions,
} from "@/utils/adminFilterOptions";
import type { PublicReviewItem } from "@/types/ecommerce.type";

const PAGE_SIZE = 10;

export default function ReviewManagementPage() {
  const { access } = useRoleAccess();
  const [reviews, setReviews] = useState<PublicReviewItem[]>([]);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("ALL");
  const [visibilityFilter, setVisibilityFilter] = useState("ALL");
  const [sortFilter, setSortFilter] = useState("NEWEST");
  const debouncedSearch = useDebounce(search, 300);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const result = await reviewApi.adminList({
        page,
        size: PAGE_SIZE,
        search: debouncedSearch || undefined,
        rating: ratingFilter !== "ALL" ? Number(ratingFilter) : undefined,
        visible:
          visibilityFilter === "VISIBLE" ? true : visibilityFilter === "HIDDEN" ? false : undefined,
        sort: sortFilter,
      });
      setReviews(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch {
      toast.error("Không thể tải đánh giá");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, ratingFilter, sortFilter, visibilityFilter]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, ratingFilter, visibilityFilter, sortFilter]);

  const handleReply = async (reviewId: string) => {
    const reply = replies[reviewId];
    if (!reply?.trim()) return;
    try {
      await reviewApi.adminReply(reviewId, reply);
      toast.success("Đã trả lời đánh giá");
      void loadReviews();
    } catch {
      toast.error("Không thể trả lời");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setRatingFilter("ALL");
    setVisibilityFilter("ALL");
    setSortFilter("NEWEST");
    setPage(0);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý đánh giá</h1>
        <p className="text-sm text-muted-foreground">Xem và kiểm duyệt toàn bộ đánh giá khách hàng.</p>
      </div>

      <AdminFilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Tìm theo tiêu đề hoặc nội dung...",
        }}
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
          {
            id: "review-sort",
            label: "Sắp xếp",
            value: sortFilter,
            onChange: setSortFilter,
            options: reviewSortFilterOptions(),
          },
        ]}
        onReset={resetFilters}
        onRefresh={loadReviews}
        refreshing={loading}
        resultText={`${totalElements} đánh giá`}
      />

      <div className="space-y-4">
        {loading ? (
          <p>Đang tải...</p>
        ) : reviews.length === 0 ? (
          <p className="rounded-lg border p-6 text-center text-muted-foreground">
            Không có đánh giá phù hợp bộ lọc.
          </p>
        ) : (
          reviews.map((review) => (
            <div key={review.reviewId} className="space-y-3">
              <ReviewCard review={review} showVisibility />
              {access.moderateReviews && (
                <div className="flex flex-wrap gap-2 rounded-lg border bg-muted/20 p-3">
                  <Input
                    placeholder="Trả lời khách hàng..."
                    value={replies[review.reviewId] || ""}
                    onChange={(e) => setReplies({ ...replies, [review.reviewId]: e.target.value })}
                    className="max-w-xl"
                  />
                  <Button size="sm" onClick={() => handleReply(review.reviewId)}>
                    Gửi phản hồi
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      reviewApi
                        .adminVisibility(review.reviewId, !review.visible)
                        .then(() => loadReviews())
                    }
                  >
                    {review.visible ? "Ẩn review" : "Hiện review"}
                  </Button>
                </div>
              )}
            </div>
          ))
        )}

        <TablePagination
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
