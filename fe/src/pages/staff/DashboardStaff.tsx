import { Link } from "react-router-dom";
import { Package, ShoppingCart, Warehouse, RotateCcw, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { filterStaffMenu } from "@/config/menuAccess";
import { menuItems } from "@/components/layouts/Staff/Sidebar/data/MenuData";

const ICONS: Record<string, typeof Package> = {
  "/staff/products": Package,
  "/staff/inventory": Warehouse,
  "/staff/orders": ShoppingCart,
  "/staff/returns": RotateCcw,
  "/staff/reviews": Star,
};

export default function DashboardStaff() {
  const { role } = useRoleAccess();
  const links = filterStaffMenu(
    menuItems.filter((item) => item.href && item.href !== "/staff"),
    role
  ).map((item) => ({
    href: item.href!,
    label: item.title,
    icon: ICONS[item.href!] ?? Package,
  }));

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Staff Dashboard</h1>
      <p className="text-muted-foreground">
        Quản lý catalog, tồn kho, đơn hàng, đổi trả và đánh giá theo quyền vai trò.
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {links.map(({ href, label, icon: Icon }) => (
          <Button key={href} asChild variant="outline" className="h-24 flex-col gap-2">
            <Link to={href}>
              <Icon className="h-6 w-6" />
              {label}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
}
