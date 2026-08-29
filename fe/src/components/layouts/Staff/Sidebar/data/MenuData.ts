import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  RotateCcw,
  Star,
} from "lucide-react";
import type { MenuItem } from "../types/type";

export const menuItems: MenuItem[] = [
  { title: "Dashboard", href: "/staff", icon: LayoutDashboard },
  { title: "Products", href: "/staff/products", icon: Package },
  { title: "Inventory", href: "/staff/inventory", icon: Warehouse },
  { title: "Orders", href: "/staff/orders", icon: ShoppingCart },
  { title: "Returns", href: "/staff/returns", icon: RotateCcw },
  { title: "Reviews", href: "/staff/reviews", icon: Star },
];
