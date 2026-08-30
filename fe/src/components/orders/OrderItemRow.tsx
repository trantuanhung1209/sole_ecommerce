import { Link } from "react-router-dom";
import { money } from "@/services/ecommerceServices";
import type { OrderItem } from "@/types/ecommerce.type";
import { formatOrderItemMeta, orderItemImage } from "@/utils/orderDisplay";

type OrderItemRowProps = {
  item: OrderItem;
  linkToProduct?: boolean;
  children?: React.ReactNode;
};

export function OrderItemRow({ item, linkToProduct = true, children }: OrderItemRowProps) {
  const productUrl = item.productId ? `/products/${item.productId}` : null;
  const meta = formatOrderItemMeta(item);

  const image = (
    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F1F1EF] sm:h-20 sm:w-20">
      <img
        src={orderItemImage(item)}
        alt={item.productNameSnapshot}
        className="h-full w-full object-contain p-1.5"
      />
    </div>
  );

  const details = (
    <div className="min-w-0 flex-1">
      {linkToProduct && productUrl ? (
        <Link to={productUrl} className="line-clamp-2 font-semibold hover:text-[#E53935]">
          {item.productNameSnapshot}
        </Link>
      ) : (
        <p className="line-clamp-2 font-semibold">{item.productNameSnapshot}</p>
      )}
      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-[#6B7280]">
        {item.brandNameSnapshot ? <span>{item.brandNameSnapshot}</span> : null}
        {meta ? <span>{meta}</span> : null}
        {item.skuSnapshot ? <span>SKU {item.skuSnapshot}</span> : null}
      </div>
      <p className="mt-1 text-xs text-[#6B7280]">
        {money(item.unitPrice)} × {item.quantity}
      </p>
      {children}
    </div>
  );

  return (
    <div className="flex gap-3 sm:gap-4">
      {linkToProduct && productUrl ? <Link to={productUrl}>{image}</Link> : image}
      <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
        {details}
        <p className="shrink-0 text-sm font-bold sm:text-base">{money(item.lineTotal)}</p>
      </div>
    </div>
  );
}
