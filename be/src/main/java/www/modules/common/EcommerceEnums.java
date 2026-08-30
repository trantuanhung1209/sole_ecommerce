package www.modules.common;

public final class EcommerceEnums {
    private EcommerceEnums() {}

    public enum ProductStatus {
        DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, PUBLISHED, UNPUBLISHED
    }

    public enum PublicStatus {
        DRAFT, PUBLISHED, HIDDEN
    }

    public enum VariantStatus {
        ACTIVE, INACTIVE
    }

    public enum GenderTarget {
        MEN, WOMEN, UNISEX, KIDS
    }

    public enum CartStatus {
        ACTIVE, CHECKED_OUT, ABANDONED
    }

    public enum OrderStatus {
        PENDING_PAYMENT, PAID, CONFIRMED, PROCESSING, SHIPPED, DELIVERED,
        COMPLETED, CANCELLED, RETURN_REQUESTED, RETURNED, REFUNDED
    }

    public enum EcommercePaymentStatus {
        UNPAID, PENDING, COMPLETED, FAILED, CANCELLED, EXPIRED, REFUNDED, PARTIALLY_REFUNDED
    }

    public enum FulfillmentStatus {
        UNFULFILLED, PROCESSING, SHIPPED, DELIVERED, RETURNED
    }

    public enum ReservationStatus {
        ACTIVE, CONFIRMED, RELEASED, EXPIRED
    }

    public enum ReturnStatus {
        PENDING, CONFIRMED, STAFF_CONFIRMED, REJECTED, APPROVED, RECEIVED, REFUND_PENDING, REFUNDED, CLOSED
    }

    public enum RefundStatus {
        NOT_REQUIRED, PENDING, PROCESSING, COMPLETED, FAILED
    }

    public enum RefundMethod {
        BANK_TRANSFER, SEPAY, CASH, OTHER
    }

    public enum ReturnItemCondition {
        GOOD, DAMAGED, INCOMPLETE
    }

    public enum PermissionGroup {
        CATALOG, INVENTORY, ORDER, PAYMENT, RETURN, REVIEW, USER, REPORT, SYSTEM, AUDIT
    }

    public enum AiRouteType {
        PRODUCT_INFO, SIZE_ADVICE, ORDER_STATUS, PAYMENT_REFUND_POLICY, RETURN_POLICY, CHITCHAT
    }

    public enum NotificationType {
        ORDER_CREATED,
        ORDER_PAID,
        ORDER_SHIPPED,
        ORDER_DELIVERED,
        ORDER_CANCELLED,
        PAYMENT_SUCCESS,
        PAYMENT_FAILED,
        RETURN_REQUESTED,
        RETURN_APPROVED,
        RETURN_REJECTED,
        REFUND_PENDING,
        REFUND_COMPLETED,
        STAFF_NEW_ORDER,
        STAFF_NEW_RETURN,
        SYSTEM
    }
}
