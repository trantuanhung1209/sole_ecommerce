import { Bot, Home, Info, Mail, ShoppingBag, Tag, type LucideIcon } from "lucide-react";

export type PublicNavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
};

export const publicNavigation: PublicNavItem[] = [
  {
    name: "Trang chủ",
    href: "/",
    icon: Home,
    match: (pathname) => pathname === "/",
  },
  {
    name: "Sản phẩm",
    href: "/products",
    icon: ShoppingBag,
    match: (pathname) =>
      pathname === "/products" || pathname.startsWith("/products/") || pathname.startsWith("/categories"),
  },
  {
    name: "Thương hiệu",
    href: "/brands",
    icon: Tag,
    match: (pathname) => pathname === "/brands",
  },
  {
    name: "Trợ lý AI",
    href: "/ai-chat",
    icon: Bot,
    match: (pathname) => pathname === "/ai-chat",
  },
  {
    name: "Về SOLE",
    href: "/about",
    icon: Info,
    match: (pathname) => pathname === "/about",
  },
  {
    name: "Liên hệ",
    href: "/contact",
    icon: Mail,
    match: (pathname) => pathname === "/contact",
  },
];
