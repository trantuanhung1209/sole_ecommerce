export type ProductStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "PUBLISHED"
  | "UNPUBLISHED";

export type PublicStatus = "DRAFT" | "PUBLISHED" | "HIDDEN";
export type VariantStatus = "ACTIVE" | "INACTIVE";
export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "RETURNED"
  | "REFUNDED";

export interface Product {
  productId: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  brandId?: string;
  categoryIds: string[];
  genderTarget?: "MEN" | "WOMEN" | "UNISEX" | "KIDS";
  material?: string;
  careInstruction?: string;
  imageUrls: string[];
  status: ProductStatus;
  publicStatus: PublicStatus;
}

export interface ProductSummary extends Product {
  brandName?: string;
  minPrice?: number;
  compareAtPrice?: number;
}

export interface ProductVariant {
  variantId: string;
  productId: string;
  sku: string;
  size: string;
  colorName: string;
  colorHex?: string;
  price: number;
  compareAtPrice?: number;
  imageUrls: string[];
  status: VariantStatus;
  initialStock?: number;
  available?: number;
}

export interface VariantView extends ProductVariant {
  onHand?: number;
  reserved?: number;
  available?: number;
}

export interface Brand {
  brandId: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
}

export interface Category {
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
}

export interface Inventory {
  inventoryId?: string;
  variantId: string;
  warehouseId: string;
  onHand: number;
  reserved: number;
  sold: number;
  available: number;
  productId?: string;
  productName?: string;
  sku?: string;
  size?: string;
  colorName?: string;
}

export interface CartItem {
  cartItemId: string;
  variantId: string;
  quantity: number;
  priceSnapshot: number;
  addedAt: string;
  productName?: string;
  sku?: string;
  size?: string;
  colorName?: string;
  imageUrl?: string;
  productId?: string;
  productSlug?: string;
}

export interface Cart {
  cartId: string;
  userId: string;
  status: "ACTIVE" | "CHECKED_OUT" | "ABANDONED";
  items: CartItem[];
}

export interface OrderItem {
  orderItemId: string;
  productId: string;
  variantId: string;
  skuSnapshot: string;
  productNameSnapshot: string;
  brandNameSnapshot?: string;
  sizeSnapshot: string;
  colorSnapshot: string;
  imageSnapshot?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  reviewed?: boolean;
}

export interface Order {
  orderId: string;
  orderCode: string;
  status: OrderStatus;
  paymentStatus: string;
  fulfillmentStatus: string;
  items: OrderItem[];
  subtotal: number;
  discountTotal?: number;
  shippingFee: number;
  taxTotal?: number;
  grandTotal: number;
  couponCode?: string;
  customerNote?: string;
  trackingCode?: string;
  paidAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface PaymentCheckoutResponse {
  paymentId: string;
  orderId: string;
  orderInvoiceNumber: string;
  amount: number;
  currency: string;
  paymentUrl: string;
  formData: Record<string, string>;
}

export interface WishlistItem {
  wishlistItemId: string;
  productId: string;
  addedAt: string;
}

export interface ProductReview {
  reviewId: string;
  productId: string;
  userId: string;
  orderId?: string;
  rating: number;
  title?: string;
  content: string;
  imageUrls?: string[];
  helpfulCount?: number;
  verifiedPurchase?: boolean;
  visible: boolean;
  staffReply?: string;
  adminReply?: string;
  createdAt: string;
}

export interface HomeReviewItem {
  reviewId: string;
  productId: string;
  productName?: string;
  productSlug?: string;
  userId: string;
  rating: number;
  title?: string;
  content: string;
  verifiedPurchase?: boolean;
  createdAt: string;
}

export interface HomeReviewsSummary {
  averageRating: number;
  totalReviews: number;
  recent: HomeReviewItem[];
}

export interface ReturnRequest {
  returnId: string;
  orderId: string;
  orderItemId: string;
  userId: string;
  reason: string;
  description?: string;
  status: string;
  staffNote?: string;
  managerNote?: string;
  rejectedReason?: string;
  refundAmount?: number;
  manualRefundRequired?: boolean;
  createdAt: string;
}

export interface Address {
  addressId: string;
  userId?: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string;
  ward?: string;
  district?: string;
  city: string;
  isDefault?: boolean;
}

export interface PermissionMatrixRow {
  code: string;
  group: string;
  enabledByRole: Record<string, boolean>;
}

export interface PermissionMatrix {
  roles: string[];
  permissions: PermissionMatrixRow[];
}

export interface AuditLogEntry {
  auditLogId: string;
  actorId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  reason?: string;
  createdAt?: string;
}
