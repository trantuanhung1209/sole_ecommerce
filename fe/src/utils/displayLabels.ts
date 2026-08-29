import type { OrderStatus, ProductStatus, PublicStatus } from "@/types/ecommerce.type";
import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "@/components/ui/badge";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  CONFIRMED: "Đã xác nhận",
  PROCESSING: "Đang xử lý",
  SHIPPED: "Đang giao",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  RETURN_REQUESTED: "Yêu cầu trả hàng",
  RETURNED: "Đã trả hàng",
  REFUNDED: "Đã hoàn tiền",
};

export const RETURN_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xử lý",
  STAFF_CONFIRMED: "NV đã xác nhận",
  APPROVED: "Đã duyệt hoàn tiền",
  REJECTED: "Đã từ chối",
};

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: "Bản nháp",
  PENDING_APPROVAL: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Bị từ chối",
  PUBLISHED: "Đã xuất bản",
  UNPUBLISHED: "Ngừng xuất bản",
};

export const PUBLIC_STATUS_LABELS: Record<PublicStatus, string> = {
  DRAFT: "Nháp",
  PUBLISHED: "Công khai",
  HIDDEN: "Ẩn",
};

export const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: "Khách hàng",
  STAFF: "Nhân viên",
  SHOP_MANAGER: "Quản lý shop",
  ADMIN: "Quản trị viên",
  SUPER_ADMIN: "Siêu quản trị",
};

export const PERMISSION_GROUP_LABELS: Record<string, string> = {
  CATALOG: "Danh mục",
  ORDER: "Đơn hàng",
  RETURN: "Đổi/trả",
  USER: "Người dùng",
  REPORT: "Báo cáo",
  RBAC: "Phân quyền",
};

export const PERMISSION_LABELS: Record<string, string> = {
  CREATE_PRODUCT: "Tạo sản phẩm",
  APPROVE_PRODUCT: "Duyệt sản phẩm",
  PUBLISH_PRODUCT: "Xuất bản sản phẩm",
  MANAGE_INVENTORY: "Quản lý tồn kho",
  MANAGE_ORDERS: "Quản lý đơn hàng",
  PROCESS_RETURN_STAFF: "Xử lý trả hàng (NV)",
  APPROVE_RETURN: "Duyệt hoàn tiền",
  MANAGE_USERS: "Quản lý người dùng",
  VIEW_REPORTS: "Xem báo cáo",
  MANAGE_ROLE_PERMISSIONS: "Quản lý phân quyền",
};

const ORDER_STATUS_VARIANTS: Partial<Record<OrderStatus, BadgeVariant>> = {
  PENDING_PAYMENT: "warning",
  PAID: "info",
  CONFIRMED: "info",
  PROCESSING: "info",
  SHIPPED: "default",
  DELIVERED: "success",
  COMPLETED: "success",
  CANCELLED: "destructive",
  RETURN_REQUESTED: "warning",
  RETURNED: "secondary",
  REFUNDED: "secondary",
};

const RETURN_STATUS_VARIANTS: Record<string, BadgeVariant> = {
  PENDING: "warning",
  STAFF_CONFIRMED: "info",
  APPROVED: "success",
  REJECTED: "destructive",
};

const PRODUCT_STATUS_VARIANTS: Partial<Record<ProductStatus, BadgeVariant>> = {
  DRAFT: "secondary",
  PENDING_APPROVAL: "warning",
  APPROVED: "info",
  REJECTED: "destructive",
  PUBLISHED: "success",
  UNPUBLISHED: "secondary",
};

const PUBLIC_STATUS_VARIANTS: Partial<Record<PublicStatus, BadgeVariant>> = {
  DRAFT: "secondary",
  PUBLISHED: "success",
  HIDDEN: "outline",
};

export function getOrderStatusLabel(status: OrderStatus | string): string {
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status;
}

export function getReturnStatusLabel(status: string): string {
  return RETURN_STATUS_LABELS[status] ?? status;
}

export function getProductStatusLabel(status: ProductStatus | string): string {
  return PRODUCT_STATUS_LABELS[status as ProductStatus] ?? status;
}

export function getPublicStatusLabel(status: PublicStatus | string): string {
  return PUBLIC_STATUS_LABELS[status as PublicStatus] ?? status;
}

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}

export function getPermissionLabel(code: string): string {
  return PERMISSION_LABELS[code] ?? code.replace(/_/g, " ").toLowerCase();
}

export function getPermissionGroupLabel(group: string): string {
  return PERMISSION_GROUP_LABELS[group] ?? group;
}

export function getOrderStatusVariant(status: OrderStatus | string): BadgeVariant {
  return ORDER_STATUS_VARIANTS[status as OrderStatus] ?? "outline";
}

export function getReturnStatusVariant(status: string): BadgeVariant {
  return RETURN_STATUS_VARIANTS[status] ?? "outline";
}

export function getProductStatusVariant(status: ProductStatus | string): BadgeVariant {
  return PRODUCT_STATUS_VARIANTS[status as ProductStatus] ?? "outline";
}

export function getPublicStatusVariant(status: PublicStatus | string): BadgeVariant {
  return PUBLIC_STATUS_VARIANTS[status as PublicStatus] ?? "outline";
}

export function formatCartItemLabel(item: {
  productName?: string;
  size?: string;
  colorName?: string;
  sku?: string;
}): string {
  const parts = [item.productName, item.size, item.colorName].filter(Boolean);
  if (parts.length > 0) return parts.join(" · ");
  if (item.sku) return `SKU ${item.sku}`;
  return "Sản phẩm";
}
