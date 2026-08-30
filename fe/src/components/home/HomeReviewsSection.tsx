import { Link } from "react-router-dom";
import { BadgeCheck } from "lucide-react";
import { StarRating } from "@/components/ecommerce/StarRating";
import { Skeleton } from "@/components/ui/skeleton";
import type { HomeReviewItem, HomeReviewsSummary } from "@/types/ecommerce.type";

function maskReviewerName(userId?: string) {
  if (!userId || userId.length <= 6) return "Khách hàng";
  return `Khách ${userId.slice(-4).toUpperCase()}`;
}

function reviewQuote(review: HomeReviewItem) {
  if (review.title && review.content) return `${review.title} — ${review.content}`;
  return review.content || review.title || "";
}

type HomeReviewsSectionProps = {
  data: HomeReviewsSummary | null;
  loading: boolean;
};

export function HomeReviewsSection({ data, loading }: HomeReviewsSectionProps) {
  const averageRating = data?.averageRating ?? 0;
  const totalReviews = data?.totalReviews ?? 0;
  const recent = data?.recent ?? [];

  return (
    <section className="mx-auto max-w-[1240px] px-4 pb-12 md:px-5">
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 md:p-10">
        <div className="grid gap-8 md:grid-cols-[1fr_1.2fr] md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#E53935]">Khách hàng nói gì</p>
            <h2 className="mt-2 text-3xl font-bold">Trusted by sneakerheads</h2>
            <p className="mt-3 text-sm text-[#6B7280]">
              Đánh giá thật từ khách đã mua hàng — minh bạch và có thể xem chi tiết sản phẩm.
            </p>
            {loading ? (
              <Skeleton className="mt-5 h-6 w-40 rounded bg-[#F1F1EF]" />
            ) : totalReviews > 0 ? (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <StarRating rating={averageRating} size="md" showValue />
                <span className="text-sm font-bold">
                  {averageRating.toFixed(1)}/5 · {totalReviews} đánh giá
                </span>
                <Link to="/reviews" className="text-sm font-bold text-[#E53935] hover:underline">
                  Xem tất cả →
                </Link>
              </div>
            ) : (
              <p className="mt-5 text-sm font-semibold text-[#6B7280]">Chưa có đánh giá công khai</p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-28 rounded-xl bg-[#F1F1EF]" />
              ))
            ) : recent.length === 0 ? (
              <div className="sm:col-span-2 rounded-xl bg-[#F7F7F5] p-6 text-center">
                <p className="text-sm font-semibold">Chưa có review nào</p>
                <p className="mt-2 text-sm text-[#6B7280]">
                  Mua hàng và đánh giá sau khi nhận đơn để xuất hiện tại đây.
                </p>
                <Link to="/products" className="mt-4 inline-block text-sm font-bold underline">
                  Khám phá sản phẩm
                </Link>
              </div>
            ) : (
              recent.map((review) => {
                const productUrl = review.productSlug
                  ? `/products/${review.productSlug}`
                  : review.productId
                    ? `/products/${review.productId}`
                    : null;

                return (
                  <div key={review.reviewId} className="rounded-xl bg-[#F7F7F5] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <BadgeCheck className="h-4 w-4 shrink-0 text-[#E53935]" />
                        <span className="text-sm font-bold">{maskReviewerName(review.userId)}</span>
                      </div>
                      <StarRating rating={review.rating ?? 0} size="sm" />
                    </div>
                    {review.productName && productUrl ? (
                      <Link
                        to={productUrl}
                        className="mt-2 block text-xs font-semibold text-[#E53935] hover:underline"
                      >
                        {review.productName}
                      </Link>
                    ) : null}
                    <p className="mt-2 line-clamp-3 text-sm text-[#6B7280]">"{reviewQuote(review)}"</p>
                    {review.verifiedPurchase ? (
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">
                        Đã mua hàng
                      </p>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
