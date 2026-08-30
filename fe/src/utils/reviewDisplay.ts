export function maskReviewerName(userId?: string) {
  if (!userId || userId.length <= 6) return "Khách hàng";
  return `Khách ${userId.slice(-4).toUpperCase()}`;
}

export function formatReviewDate(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function productReviewUrl(review: { productSlug?: string; productId?: string }) {
  if (review.productSlug) return `/products/${review.productSlug}`;
  if (review.productId) return `/products/${review.productId}`;
  return null;
}
