import { Badge } from "@/components/ui/badge";
import {
  getFulfillmentStatusLabel,
  getOrderStatusLabel,
  getOrderStatusVariant,
  getPaymentStatusLabel,
  getPaymentStatusVariant,
  getProductStatusLabel,
  getProductStatusVariant,
  getPublicStatusLabel,
  getPublicStatusVariant,
  getRefundStatusLabel,
  getReturnStatusLabel,
  getReturnStatusVariant,
} from "@/utils/displayLabels";

type StatusKind = "order" | "product" | "public" | "return" | "payment" | "refund" | "fulfillment";

type StatusBadgeProps = {
  kind: StatusKind;
  status: string;
  className?: string;
};

export function StatusBadge({ kind, status, className }: StatusBadgeProps) {
  const label =
    kind === "order"
      ? getOrderStatusLabel(status)
      : kind === "product"
        ? getProductStatusLabel(status)
        : kind === "public"
          ? getPublicStatusLabel(status)
          : kind === "payment"
            ? getPaymentStatusLabel(status)
            : kind === "refund"
              ? getRefundStatusLabel(status)
              : kind === "fulfillment"
                ? getFulfillmentStatusLabel(status)
                : getReturnStatusLabel(status);

  const variant =
    kind === "order"
      ? getOrderStatusVariant(status)
      : kind === "product"
        ? getProductStatusVariant(status)
        : kind === "public"
          ? getPublicStatusVariant(status)
          : kind === "payment"
            ? getPaymentStatusVariant(status)
            : kind === "return"
              ? getReturnStatusVariant(status)
              : "outline";

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
