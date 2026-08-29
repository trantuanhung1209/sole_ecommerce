import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  RotateCcw,
  Star,
  Users,
  ShieldCheck,
  Tag,
  FolderTree,
} from "lucide-react";
import type { MenuItem } from "../types/type";

export const menuItems: MenuItem[] = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  {
    title: "Catalog",
    icon: Package,
    subItems: [
      { title: "Products", href: "/admin/products", icon: Package, description: "Manage products and variants" },
      { title: "Brands", href: "/admin/brands", icon: Tag, description: "Manage shoe brands" },
      { title: "Categories", href: "/admin/categories", icon: FolderTree, description: "Manage categories" },
    ],
  },
  { title: "Inventory", href: "/admin/inventory", icon: Warehouse },
  { title: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { title: "Returns", href: "/admin/returns", icon: RotateCcw },
  { title: "Reviews", href: "/admin/reviews", icon: Star },
  {
    title: "Users",
    icon: Users,
    subItems: [
      { title: "All Users", href: "/admin/users", icon: Users, description: "Manage users and roles" },
      { title: "Roles & Permissions", href: "/admin/role-permissions", icon: ShieldCheck, description: "RBAC matrix" },
    ],
  },
];
