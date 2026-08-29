import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { CartItem } from "@/types/ecommerce.type";
import { resolveCartItemProductUrl } from "@/utils/cartNavigation";

type CartItemLinkProps = {
  item: CartItem;
  onNavigate?: () => void;
  className?: string;
  children: ReactNode;
};

export function CartItemLink({ item, onNavigate, className = "", children }: CartItemLinkProps) {
  const navigate = useNavigate();

  const handleClick = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const url = await resolveCartItemProductUrl(item);
    if (!url) return;

    onNavigate?.();
    navigate(url);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`block w-full cursor-pointer text-left transition-colors hover:bg-accent/5 ${className}`}
    >
      {children}
    </button>
  );
}
