import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import type { CartItem } from "@/types/ecommerce.type";

export function cartItemProductUrl(item: CartItem): string | null {
  if (item.productSlug) return `/products/${item.productSlug}`;
  if (item.productId) return `/products/${item.productId}`;
  return null;
}

type CartItemLinkProps = {
  item: CartItem;
  onNavigate?: () => void;
  className?: string;
  children: ReactNode;
};

export function CartItemLink({ item, onNavigate, className = "", children }: CartItemLinkProps) {
  const url = cartItemProductUrl(item);

  if (!url) {
    return <div className={className}>{children}</div>;
  }

  return (
    <Link
      to={url}
      onClick={onNavigate}
      className={`block cursor-pointer transition hover:bg-[#F7F7F5] ${className}`}
    >
      {children}
    </Link>
  );
}
