import authorizedAxios from "@/utils/authorizedAxios";
import publicAxios from "@/utils/publicAxios";
import cartAxios from "@/utils/cartAxios";
import type { ApiResponse, PageResponse } from "@/types/api.type";
import type {
  Address,
  Brand,
  Cart,
  Category,
  Inventory,
  Order,
  OrderStatus,
  PaymentCheckoutResponse,
  PermissionMatrix,
  Product,
  ProductSummary,
  HomeReviewsSummary,
  PublicReviewItem,
  ProductReview,
  ProductStatus,
  ProductVariant,
  PublicStatus,
  ReturnRequest,
  VariantView,
  WishlistItem,
  AuditLogEntry,
} from "@/types/ecommerce.type";

export const money = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(`data:${file.type};base64,${base64}`);
    };
    reader.onerror = reject;
  });

export const catalogApi = {
  uploadImages: async (files: File[]) => {
    const images = await Promise.all(files.map(fileToBase64));
    const res = await authorizedAxios.post<ApiResponse<string[]>>("/admin/catalog/images", { images });
    return res.data.data;
  },
};

export interface ProductFilterParams {
  search?: string;
  brandId?: string;
  categoryId?: string;
  gender?: string;
  minPrice?: number;
  maxPrice?: number;
  variantSize?: string;
  color?: string;
  inStock?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export const productApi = {
  list: async (params: ProductFilterParams = {}) => {
    const { page = 0, pageSize = 12, ...filters } = params;
    const res = await publicAxios.get<ApiResponse<PageResponse<ProductSummary>>>("/products", {
      params: { ...filters, page, pageSize },
    });
    return res.data.data;
  },
  related: async (productId: string, limit = 8) => {
    const res = await publicAxios.get<ApiResponse<ProductSummary[]>>(`/products/${productId}/related`, {
      params: { limit },
    });
    return res.data.data;
  },
  detail: async (idOrSlug: string) => {
    const res = await publicAxios.get<ApiResponse<Product>>(`/products/${idOrSlug}`);
    return res.data.data;
  },
  variants: async (productId: string) => {
    const res = await publicAxios.get<ApiResponse<ProductVariant[]>>(`/products/${productId}/variants`);
    return res.data.data;
  },
  variantProductMeta: async (variantId: string) => {
    const res = await publicAxios.get<ApiResponse<{ productId: string; slug: string }>>(
      `/variants/${variantId}/product-meta`
    );
    return res.data.data;
  },
  adminVariants: async (productId: string) => {
    const res = await authorizedAxios.get<ApiResponse<VariantView[]>>(`/admin/products/${productId}/variants`);
    return res.data.data;
  },
  adminList: async (
    search?: string,
    page = 0,
    size = 10,
    status?: ProductStatus,
    publicStatus?: PublicStatus
  ) => {
    const res = await authorizedAxios.get<ApiResponse<PageResponse<Product>>>("/admin/products", {
      params: { search, page, size, status, publicStatus },
    });
    return res.data.data;
  },
  create: async (data: Partial<Product>) => {
    const res = await authorizedAxios.post<ApiResponse<Product>>("/admin/products", data);
    return res.data.data;
  },
  update: async (productId: string, data: Partial<Product>) => {
    const res = await authorizedAxios.put<ApiResponse<Product>>(`/admin/products/${productId}`, data);
    return res.data.data;
  },
  approve: async (productId: string) => {
    const res = await authorizedAxios.post<ApiResponse<Product>>(`/admin/products/${productId}/approve`);
    return res.data.data;
  },
  reject: async (productId: string, reason: string) => {
    const res = await authorizedAxios.post<ApiResponse<Product>>(
      `/admin/products/${productId}/reject`,
      { reason }
    );
    return res.data.data;
  },
  publish: async (productId: string) => {
    const res = await authorizedAxios.post<ApiResponse<Product>>(`/admin/products/${productId}/publish`);
    return res.data.data;
  },
  unpublish: async (productId: string) => {
    const res = await authorizedAxios.post<ApiResponse<Product>>(`/admin/products/${productId}/unpublish`);
    return res.data.data;
  },
  createVariant: async (productId: string, data: Partial<ProductVariant> & { initialStock?: number }) => {
    const res = await authorizedAxios.post<ApiResponse<ProductVariant>>(`/admin/products/${productId}/variants`, data);
    return res.data.data;
  },
  updateVariant: async (
    productId: string,
    variantId: string,
    data: Partial<ProductVariant> & { initialStock?: number }
  ) => {
    const res = await authorizedAxios.put<ApiResponse<ProductVariant>>(
      `/admin/products/${productId}/variants/${variantId}`,
      data
    );
    return res.data.data;
  },
  deleteVariant: async (productId: string, variantId: string) => {
    await authorizedAxios.delete(`/admin/products/${productId}/variants/${variantId}`);
  },
};

export const brandApi = {
  list: async () => {
    const res = await publicAxios.get<ApiResponse<Brand[]>>("/brands");
    return res.data.data;
  },
  create: async (data: Partial<Brand>) => {
    const res = await authorizedAxios.post<ApiResponse<Brand>>("/admin/brands", data);
    return res.data.data;
  },
};

export const categoryApi = {
  list: async () => {
    const res = await publicAxios.get<ApiResponse<Category[]>>("/categories");
    return res.data.data;
  },
  create: async (data: Partial<Category>) => {
    const res = await authorizedAxios.post<ApiResponse<Category>>("/admin/categories", data);
    return res.data.data;
  },
};

export const cartApi = {
  get: async () => {
    const res = await cartAxios.get<ApiResponse<Cart>>("/cart");
    return res.data.data;
  },
  validate: async () => {
    const res = await cartAxios.post<
      ApiResponse<{ valid: boolean; issues: { cartItemId?: string; variantId?: string; message: string }[] }>
    >("/cart/validate");
    return res.data.data;
  },
  add: async (variantId: string, quantity: number) => {
    const res = await cartAxios.post<ApiResponse<Cart>>("/cart/items", { variantId, quantity });
    return res.data.data;
  },
  update: async (cartItemId: string, quantity: number) => {
    const res = await cartAxios.put<ApiResponse<Cart>>(`/cart/items/${cartItemId}`, { quantity });
    return res.data.data;
  },
  remove: async (cartItemId: string) => {
    const res = await cartAxios.delete<ApiResponse<Cart>>(`/cart/items/${cartItemId}`);
    return res.data.data;
  },
};

export const checkoutApi = {
  preview: async (couponCode?: string) => {
    const res = await authorizedAxios.post<ApiResponse<{
      itemCount: number;
      subtotal: number;
      discountTotal: number;
      shippingFee: number;
      taxTotal: number;
      grandTotal: number;
      couponValid?: boolean;
      couponMessage?: string;
    }>>("/checkout/preview", null, { params: { couponCode } });
    return res.data.data;
  },
  checkout: async (addressId: string, customerNote?: string, couponCode?: string) => {
    const res = await authorizedAxios.post<ApiResponse<PaymentCheckoutResponse>>("/checkout", {
      addressId,
      customerNote,
      couponCode,
      paymentMethod: "SEPAY",
    });
    return res.data.data;
  },
};

export const orderApi = {
  mine: async (page = 0, size = 10) => {
    const res = await authorizedAxios.get<ApiResponse<PageResponse<Order>>>("/orders/my-orders", {
      params: { page, size },
    });
    return res.data.data;
  },
  detail: async (orderId: string) => {
    const res = await authorizedAxios.get<ApiResponse<Order>>(`/orders/${orderId}`);
    return res.data.data;
  },
  cancel: async (orderId: string, reason?: string) => {
    const res = await authorizedAxios.post<ApiResponse<Order>>(`/orders/${orderId}/cancel`, null, {
      params: { reason },
    });
    return res.data.data;
  },
  adminList: async (status?: OrderStatus, page = 0, size = 10, search?: string) => {
    const res = await authorizedAxios.get<ApiResponse<PageResponse<Order>>>("/admin/orders", {
      params: { status, page, size, search },
    });
    return res.data.data;
  },
  adminDetail: async (orderId: string) => {
    const res = await authorizedAxios.get<ApiResponse<Order>>(`/admin/orders/${orderId}`);
    return res.data.data;
  },
  updateStatus: async (orderId: string, status: OrderStatus, trackingCode?: string) => {
    if (status === "SHIPPED" && trackingCode) {
      const res = await authorizedAxios.post<ApiResponse<Order>>(`/admin/orders/${orderId}/ship`, null, {
        params: { trackingCode },
      });
      return res.data.data;
    }
    const res = await authorizedAxios.put<ApiResponse<Order>>(`/admin/orders/${orderId}/status`, null, {
      params: { status },
    });
    return res.data.data;
  },
};

export const inventoryApi = {
  list: async (page = 0, size = 10, search?: string, stockFilter?: string) => {
    const res = await authorizedAxios.get<ApiResponse<PageResponse<Inventory>>>("/admin/inventory", {
      params: { page, size, search, stockFilter },
    });
    return res.data.data;
  },
  adjust: async (variantId: string, quantityChange: number) => {
    const res = await authorizedAxios.put<ApiResponse<Inventory>>(
      `/admin/inventory/${variantId}/adjust`,
      { quantityChange }
    );
    return res.data.data;
  },
  importStock: async (items: { variantId: string; quantity: number }[]) => {
    const res = await authorizedAxios.post<ApiResponse<Inventory[]>>("/admin/inventory/import", { items });
    return res.data.data;
  },
  lowStock: async (threshold = 5) => {
    const res = await authorizedAxios.get<ApiResponse<Inventory[]>>("/admin/inventory/low-stock", {
      params: { threshold },
    });
    return res.data.data;
  },
};

export const searchApi = {
  reindex: async () => {
    const res = await authorizedAxios.post<ApiResponse<number>>("/admin/search/reindex");
    return res.data.data;
  },
};

export interface Coupon {
  couponId: string;
  code: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount?: number;
  active?: boolean;
  startsAt?: string;
  endsAt?: string;
}

export const promotionApi = {
  validate: async (code: string, subtotal: number) => {
    const res = await authorizedAxios.post<ApiResponse<{
      valid: boolean;
      message: string;
      discountAmount: number;
      freeShipping: boolean;
    }>>("/promotions/validate", { code, subtotal });
    return res.data.data;
  },
  listCoupons: async () => {
    const res = await authorizedAxios.get<ApiResponse<Coupon[]>>("/admin/promotions/coupons");
    return res.data.data;
  },
  createCoupon: async (data: Partial<Coupon> & { code: string; type: Coupon["type"]; value: number }) => {
    const res = await authorizedAxios.post<ApiResponse<Coupon>>("/admin/promotions/coupons", data);
    return res.data.data;
  },
};

export interface DashboardReport {
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  completedOrders: number;
  totalRevenue: number;
  totalProducts: number;
  publishedProducts: number;
  lowStockVariants: number;
  pendingReturns: number;
  totalUsers: number;
}

export const reportApi = {
  dashboard: async (from?: string, to?: string) => {
    const res = await authorizedAxios.get<ApiResponse<DashboardReport>>("/admin/reports/dashboard", {
      params: { from, to },
    });
    return res.data.data;
  },
};

export interface EcommercePayment {
  paymentId: string;
  orderId: string;
  orderCode?: string;
  status: string;
  amount?: number;
  paidAt?: string;
}

export const paymentApi = {
  byOrder: async (orderId: string) => {
    const res = await authorizedAxios.get<ApiResponse<EcommercePayment>>(`/payments/order/${orderId}`);
    return res.data.data;
  },
};

export const aiApi = {
  chat: async (message: string, conversationId?: string) => {
    const res = await authorizedAxios.post<
      ApiResponse<import("@/types/ai.type").AiChatResponse>
    >("/ai/chat", {
      message,
      conversationId,
    });
    return res.data.data;
  },
};

export const wishlistApi = {
  list: async () => {
    const res = await authorizedAxios.get<ApiResponse<WishlistItem[]>>("/wishlist");
    return res.data.data;
  },
  add: async (productId: string) => {
    const res = await authorizedAxios.post<ApiResponse<WishlistItem>>("/wishlist", { productId });
    return res.data.data;
  },
  remove: async (productId: string) => {
    await authorizedAxios.delete(`/wishlist/${productId}`);
  },
};

export const reviewApi = {
  home: async (limit = 4) => {
    const res = await publicAxios.get<ApiResponse<HomeReviewsSummary>>("/reviews/home", {
      params: { limit },
    });
    return res.data.data;
  },
  list: async (params: {
    page?: number;
    size?: number;
    rating?: number;
    productId?: string;
    search?: string;
    sort?: string;
  } = {}) => {
    const { page = 0, size = 12, rating, productId, search, sort = "NEWEST" } = params;
    const res = await publicAxios.get<ApiResponse<PageResponse<PublicReviewItem>>>("/reviews", {
      params: {
        page,
        size,
        rating: rating || undefined,
        productId: productId || undefined,
        search: search || undefined,
        sort,
      },
    });
    return res.data.data;
  },
  listByProduct: async (productId: string, page = 0, size = 10) => {
    const res = await publicAxios.get<ApiResponse<PageResponse<ProductReview>>>(
      `/reviews/products/${productId}`,
      { params: { page, size } }
    );
    return res.data.data;
  },
  create: async (data: {
    orderId: string;
    orderItemId: string;
    rating: number;
    title?: string;
    content: string;
    imageUrls?: string[];
  }) => {
    const res = await authorizedAxios.post<ApiResponse<ProductReview>>("/reviews/products", data);
    return res.data.data;
  },
  adminList: async (params: {
    page?: number;
    size?: number;
    rating?: number;
    productId?: string;
    search?: string;
    visible?: boolean;
    sort?: string;
  } = {}) => {
    const { page = 0, size = 10, rating, productId, search, visible, sort = "NEWEST" } = params;
    const res = await authorizedAxios.get<ApiResponse<PageResponse<PublicReviewItem>>>("/admin/reviews", {
      params: {
        page,
        size,
        rating: rating || undefined,
        productId: productId || undefined,
        search: search || undefined,
        visible: visible ?? undefined,
        sort,
      },
    });
    return res.data.data;
  },
  adminReply: async (reviewId: string, reply: string) => {
    const res = await authorizedAxios.put<ApiResponse<ProductReview>>(`/admin/reviews/${reviewId}/reply`, { reply });
    return res.data.data;
  },
  adminVisibility: async (reviewId: string, visible: boolean) => {
    const res = await authorizedAxios.put<ApiResponse<ProductReview>>(`/admin/reviews/${reviewId}/visibility`, {
      visible,
    });
    return res.data.data;
  },
  mine: async (page = 0, size = 50) => {
    const res = await authorizedAxios.get<ApiResponse<PageResponse<ProductReview>>>("/reviews/me", {
      params: { page, size },
    });
    return res.data.data.content;
  },
};

export const returnApi = {
  mine: async () => {
    const res = await authorizedAxios.get<ApiResponse<PageResponse<ReturnRequest>>>("/returns", {
      params: { size: 100 },
    });
    return res.data.data.content;
  },
  create: async (data: {
    orderId: string;
    orderItemId: string;
    reason: string;
    customerNote?: string;
    imageUrls?: string[];
  }) => {
    const res = await authorizedAxios.post<ApiResponse<ReturnRequest>>("/returns", data);
    return res.data.data;
  },
  adminList: async (page = 0, size = 10, status?: string) => {
    const res = await authorizedAxios.get<ApiResponse<PageResponse<ReturnRequest>>>("/admin/returns", {
      params: { page, size, status },
    });
    return res.data.data;
  },
  staffConfirm: async (returnId: string, note?: string) => {
    const res = await authorizedAxios.post<ApiResponse<ReturnRequest>>(
      `/admin/returns/${returnId}/staff-confirm`,
      { note }
    );
    return res.data.data;
  },
  reject: async (returnId: string, rejectedReason?: string) => {
    const res = await authorizedAxios.post<ApiResponse<ReturnRequest>>(`/admin/returns/${returnId}/reject`, {
      rejectedReason,
    });
    return res.data.data;
  },
  approve: async (returnId: string, note?: string) => {
    const res = await authorizedAxios.post<ApiResponse<ReturnRequest>>(`/admin/returns/${returnId}/approve`, { note });
    return res.data.data;
  },
  markReceived: async (returnId: string, note?: string) => {
    const res = await authorizedAxios.post<ApiResponse<ReturnRequest>>(
      `/admin/returns/${returnId}/mark-received`,
      { note }
    );
    return res.data.data;
  },
  refund: async (returnId: string, note?: string) => {
    const res = await authorizedAxios.post<ApiResponse<ReturnRequest>>(`/admin/returns/${returnId}/refund`, { note });
    return res.data.data;
  },
  updateStatus: async (returnId: string, status: string, note?: string) => {
    const res = await authorizedAxios.put<ApiResponse<ReturnRequest>>(`/admin/returns/${returnId}/status`, {
      status,
      note,
    });
    return res.data.data;
  },
};

export const addressApi = {
  list: async () => {
    const res = await authorizedAxios.get<ApiResponse<Address[]>>("/addresses");
    return res.data.data;
  },
  create: async (data: Omit<Address, "addressId">) => {
    const res = await authorizedAxios.post<ApiResponse<Address>>("/addresses", data);
    return res.data.data;
  },
  update: async (addressId: string, data: Partial<Address>) => {
    const res = await authorizedAxios.put<ApiResponse<Address>>(`/addresses/${addressId}`, data);
    return res.data.data;
  },
  remove: async (addressId: string) => {
    await authorizedAxios.delete(`/addresses/${addressId}`);
  },
  setDefault: async (addressId: string) => {
    const res = await authorizedAxios.post<ApiResponse<Address>>(`/addresses/${addressId}/default`);
    return res.data.data;
  },
};

export const rbacApi = {
  matrix: async () => {
    const res = await authorizedAxios.get<ApiResponse<PermissionMatrix>>("/admin/role-permissions/matrix");
    return res.data.data;
  },
  updateRole: async (
    roleCode: string,
    permissions: { code: string; enabled: boolean }[],
    reason: string
  ) => {
    const res = await authorizedAxios.put<ApiResponse<unknown>>(`/admin/roles/${roleCode}/permissions`, {
      permissions,
      reason,
    });
    return res.data.data;
  },
  auditLogs: async () => {
    const res = await authorizedAxios.get<ApiResponse<AuditLogEntry[]>>("/admin/audit-logs");
    return res.data.data;
  },
};
