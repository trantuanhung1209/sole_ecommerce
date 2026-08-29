import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StarRating } from "@/components/ecommerce/StarRating";
import { reviewApi } from "@/services/ecommerceServices";
import type { ProductReview } from "@/types/ecommerce.type";

export default function MyReviewsPage() {
  const [reviews, setReviews] = useState<ProductReview[]>([]);

  useEffect(() => {
    reviewApi.mine().then(setReviews).catch(console.error);
  }, []);

  return (
    <main className="mx-auto max-w-[900px] px-4 py-8 space-y-4">
      <h1 className="text-3xl font-bold">Đánh giá của tôi</h1>
      {reviews.length === 0 ? (
        <p className="text-[#6B7280]">Bạn chưa viết đánh giá nào.</p>
      ) : (
        reviews.map((review) => (
          <article key={review.reviewId} className="rounded-xl border border-[#E5E7EB] bg-white p-4">
            <div className="flex items-center justify-between">
              <StarRating rating={review.rating} size="sm" showValue />
              <span className="text-xs text-[#9CA3AF]">
                {review.createdAt ? new Date(review.createdAt).toLocaleDateString("vi-VN") : ""}
              </span>
            </div>
            {review.title ? <h2 className="mt-2 font-semibold">{review.title}</h2> : null}
            <p className="mt-2 text-sm text-[#374151]">{review.content}</p>
            <Link to={`/products/${review.productId}`} className="mt-3 inline-block text-sm underline">
              Xem sản phẩm
            </Link>
          </article>
        ))
      )}
    </main>
  );
}
