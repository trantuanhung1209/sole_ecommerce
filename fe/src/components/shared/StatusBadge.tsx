import { Badge } from "@/components/ui/badge";
import {
  getOrderStatusLabel,
  getOrderStatusVariant,
  getProductStatusLabel,
  getProductStatusVariant,
  getPublicStatusLabel,
  getPublicStatusVariant,
  getReturnStatusLabel,
  getReturnStatusVariant,
} from "@/utils/displayLabels";

type StatusKind = "order" | "product" | "public" | "return";

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
          : getReturnStatusLabel(status);

  const variant =
    kind === "order"
      ? getOrderStatusVariant(status)
      : kind === "product"
        ? getProductStatusVariant(status)
        : kind === "public"
          ? getPublicStatusVariant(status)
          : getReturnStatusVariant(status);

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
