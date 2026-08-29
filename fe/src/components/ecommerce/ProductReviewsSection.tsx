import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, ThumbsUp } from "lucide-react";
import { toast } from "react-toastify";
import { TablePagination } from "@/components/shared/TablePagination";
import { StarRating } from "@/components/ecommerce/StarRating";
import { Button } from "@/components/ui/button";
import { reviewApi } from "@/services/ecommerceServices";
import { getErrorMessage } from "@/utils/getErrorMessage";
import type { ProductReview } from "@/types/ecommerce.type";

const PAGE_SIZE = 5;

type ProductReviewsSectionProps = {
  productId: string;
};

function formatReviewDate(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function maskUserId(userId: string) {
  if (userId.length <= 6) return "Khách hàng";
  return `Khách ${userId.slice(-4).toUpperCase()}`;
}

export function ProductReviewsSection({ productId }: ProductReviewsSectionProps) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [statsReviews, setStatsReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const loadReviews = useCallback(
    async (targetPage = 0) => {
      setLoading(true);
      try {
        const result = await reviewApi.listByProduct(productId, targetPage, PAGE_SIZE);
        setReviews(result.content);
        setTotalPages(result.totalPages);
        setTotalElements(result.totalElements);
        setPage(targetPage);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [productId]
  );

  useEffect(() => {
    reviewApi
      .listByProduct(productId, 0, 100)
      .then((result) => setStatsReviews(result.content))
      .catch(() => setStatsReviews([]));
    void loadReviews(0);
  }, [loadReviews, productId]);

  const averageRating = useMemo(() => {
    if (statsReviews.length === 0) return 0;
    return statsReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / statsReviews.length;
  }, [statsReviews]);

  const ratingBreakdown = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0];
    statsReviews.forEach((r) => {
      const star = Math.round(r.rating || 0);
      if (star >= 1 && star <= 5) counts[star] += 1;
    });
    return counts;
  }, [statsReviews]);

  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#E53935]">Đánh giá</p>
          <h2 className="mt-2 text-2xl font-bold md:text-3xl">Khách hàng nói gì</h2>
        </div>
        <Button asChild variant="outline" className="rounded-lg border-[#D1D5DB]">
          <Link to="/orders">Viết đánh giá từ đơn hàng</Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-6 border-b border-[#E5E7EB] pb-6 md:grid-cols-[220px_1fr]">
        <div className="rounded-xl bg-[#F7F7F5] p-5 text-center">
          <p className="text-4xl font-bold">{totalElements > 0 ? averageRating.toFixed(1) : "—"}</p>
          <StarRating rating={averageRating} size="lg" className="mt-2 justify-center" />
          <p className="mt-2 text-sm text-[#6B7280]">{totalElements} đánh giá</p>
        </div>

        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingBreakdown[star] || 0;
            const percent = statsReviews.length ? Math.round((count / statsReviews.length) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-3 text-sm">
                <span className="w-8 font-semibold">{star} sao</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F1F1EF]">
                  <div className="h-full rounded-full bg-[#E53935]" style={{ width: `${percent}%` }} />
                </div>
                <span className="w-8 text-right text-[#6B7280]">{count}</span>
              </div>
            );
          })}
          <p className="text-xs text-[#9CA3AF]">
            {totalElements > statsReviews.length
              ? `Thống kê từ ${statsReviews.length}/${totalElements} đánh giá gần nhất`
              : "Thống kê từ tất cả đánh giá"}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-[#6B7280]">Đang tải đánh giá...</p>
      ) : reviews.length === 0 ? (
        <p className="mt-6 text-sm text-[#6B7280]">
          Chưa có đánh giá nào. Mua sản phẩm và đánh giá sau khi nhận hàng.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {reviews.map((review) => (
            <article key={review.reviewId} className="rounded-xl border border-[#E5E7EB] p-4 md:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{maskUserId(review.userId)}</p>
                    {review.verifiedPurchase ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#E53935]">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Đã mua hàng
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <StarRating rating={review.rating} size="sm" />
                    <span className="text-xs text-[#6B7280]">{formatReviewDate(review.createdAt)}</span>
                  </div>
                </div>
                {(review.helpfulCount ?? 0) > 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs text-[#6B7280]">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    {review.helpfulCount} hữu ích
                  </span>
                ) : null}
              </div>

              {review.title ? <h3 className="mt-3 font-semibold">{review.title}</h3> : null}
              <p className="mt-2 text-sm leading-relaxed text-[#374151]">{review.content}</p>

              {review.imageUrls && review.imageUrls.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {review.imageUrls.map((url, index) => (
                    <img
                      key={`${url}-${index}`}
                      src={url}
                      alt={`Ảnh đánh giá ${index + 1}`}
                      className="h-20 w-20 rounded-lg border object-cover"
                    />
                  ))}
                </div>
              ) : null}

              {review.staffReply || review.adminReply ? (
                <div className="mt-4 rounded-lg bg-[#F7F7F5] p-3 text-sm">
                  <p className="font-semibold text-[#111111]">Phản hồi từ cửa hàng</p>
                  <p className="mt-1 text-[#6B7280]">{review.staffReply || review.adminReply}</p>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}

      <TablePagination
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        onPageChange={loadReviews}
        className="mt-4"
      />
    </section>
  );
}
