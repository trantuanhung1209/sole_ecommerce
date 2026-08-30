import type { OrderStatus, ProductStatus, PublicStatus } from "@/types/ecommerce.type";
import {
  ORDER_STATUS_LABELS,
  PRODUCT_STATUS_LABELS,
  PUBLIC_STATUS_LABELS,
  RETURN_STATUS_LABELS,
  getRoleLabel,
} from "@/utils/displayLabels";
import type { FilterSelectOption } from "@/components/shared/AdminFilterBar";

export const ALL_OPTION: FilterSelectOption = { value: "ALL", label: "Tất cả" };

export const productStatusFilterOptions = (): FilterSelectOption[] => [
  ALL_OPTION,
  ...(Object.keys(PRODUCT_STATUS_LABELS) as ProductStatus[]).map((status) => ({
    value: status,
    label: PRODUCT_STATUS_LABELS[status],
  })),
];

export const publicStatusFilterOptions = (): FilterSelectOption[] => [
  ALL_OPTION,
  ...(Object.keys(PUBLIC_STATUS_LABELS) as PublicStatus[]).map((status) => ({
    value: status,
    label: PUBLIC_STATUS_LABELS[status],
  })),
];

export const orderStatusFilterOptions = (): FilterSelectOption[] => [
  ALL_OPTION,
  ...(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((status) => ({
    value: status,
    label: ORDER_STATUS_LABELS[status],
  })),
];

export const returnStatusFilterOptions = (): FilterSelectOption[] => [
  ALL_OPTION,
  ...Object.entries(RETURN_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

export const stockFilterOptions = (): FilterSelectOption[] => [
  { value: "ALL", label: "Tất cả tồn kho" },
  { value: "LOW", label: "Sắp hết (≤ 5)" },
  { value: "OUT", label: "Hết hàng" },
];

export const roleFilterOptions = (): FilterSelectOption[] => [
  ALL_OPTION,
  ...(["CUSTOMER", "STAFF", "SHOP_MANAGER", "ADMIN", "SUPER_ADMIN"] as const).map((role) => ({
    value: role,
    label: getRoleLabel(role),
  })),
];

export const userStatusFilterOptions = (): FilterSelectOption[] => [
  ALL_OPTION,
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "INACTIVE", label: "Đã vô hiệu" },
];

export const reviewVisibilityFilterOptions = (): FilterSelectOption[] => [
  ALL_OPTION,
  { value: "VISIBLE", label: "Đang hiển thị" },
  { value: "HIDDEN", label: "Đang ẩn" },
];

export const reviewSortFilterOptions = (): FilterSelectOption[] => [
  { value: "NEWEST", label: "Mới nhất" },
  { value: "OLDEST", label: "Cũ nhất" },
  { value: "RATING_DESC", label: "Số sao cao → thấp" },
  { value: "RATING_ASC", label: "Số sao thấp → cao" },
  { value: "HELPFUL", label: "Hữu ích nhất" },
];

export const reviewRatingFilterOptions = (): FilterSelectOption[] => [
  ALL_OPTION,
  { value: "5", label: "5 sao" },
  { value: "4", label: "4 sao" },
  { value: "3", label: "3 sao" },
  { value: "2", label: "2 sao" },
  { value: "1", label: "1 sao" },
];
