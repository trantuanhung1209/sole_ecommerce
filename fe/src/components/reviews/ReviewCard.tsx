import { Link } from "react-router-dom";
import { BadgeCheck, ThumbsUp } from "lucide-react";
import { StarRating } from "@/components/ecommerce/StarRating";
import type { PublicReviewItem } from "@/types/ecommerce.type";
import { formatReviewDate, maskReviewerName, productReviewUrl } from "@/utils/reviewDisplay";

type ReviewCardProps = {
  review: PublicReviewItem;
  showVisibility?: boolean;
};

export function ReviewCard({ review, showVisibility = false }: ReviewCardProps) {
  const productUrl = productReviewUrl(review);

  return (
    <article className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <BadgeCheck className="h-4 w-4 shrink-0 text-[#E53935]" />
          <span className="font-semibold">{maskReviewerName(review.userId)}</span>
          {review.verifiedPurchase ? (
            <span className="rounded-full bg-[#F7F7F5] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#6B7280]">
              Đã mua hàng
            </span>
          ) : null}
          {showVisibility ? (
            <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold">
              {review.visible ? "Hiển thị" : "Ẩn"}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2 text-sm text-[#6B7280]">
          <StarRating rating={review.rating ?? 0} size="sm" showValue />
          <span>{formatReviewDate(review.createdAt)}</span>
        </div>
      </div>

      {review.productName && productUrl ? (
        <Link to={productUrl} className="mt-3 inline-block text-sm font-semibold text-[#E53935] hover:underline">
          {review.productName}
        </Link>
      ) : null}

      {review.title ? <h3 className="mt-2 font-bold">{review.title}</h3> : null}
      <p className="mt-2 text-sm leading-relaxed text-[#374151]">{review.content}</p>

      {review.imageUrls && review.imageUrls.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {review.imageUrls.map((url) => (
            <img
              key={url}
              src={url}
              alt=""
              className="h-16 w-16 rounded-lg border border-[#E5E7EB] object-cover"
            />
          ))}
        </div>
      ) : null}

      {review.staffReply ? (
        <p className="mt-3 rounded-xl bg-[#F7F7F5] p-3 text-sm text-[#374151]">
          <span className="font-semibold">Phản hồi cửa hàng:</span> {review.staffReply}
        </p>
      ) : null}

      {(review.helpfulCount ?? 0) > 0 ? (
        <p className="mt-3 flex items-center gap-1 text-xs text-[#6B7280]">
          <ThumbsUp className="h-3.5 w-3.5" />
          {review.helpfulCount} người thấy hữu ích
        </p>
      ) : null}
    </article>
  );
}
