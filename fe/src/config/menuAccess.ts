import { roleAccess } from "@/config/roleAccess";
import type { UserRole } from "@/types/user.type";
import type { MenuItem } from "@/components/layouts/Admin/Sidebar/types/type";

export function filterAdminMenu(items: MenuItem[], role?: UserRole): MenuItem[] {
  return items
    .map((item) => {
      if (item.title === "Users") {
        const subItems = item.subItems?.filter((sub) => {
          if (sub.href === "/admin/role-permissions") return roleAccess.canManageRbac(role);
          if (sub.href === "/admin/users") return roleAccess.canManageUsers(role);
          return true;
        });
        if (!subItems?.length) return null;
        return { ...item, subItems };
      }

      if (item.title === "Catalog") {
        const subItems = item.subItems?.filter((sub) => {
          if (sub.href === "/admin/brands" || sub.href === "/admin/categories") {
            return roleAccess.canManageBrandsCategories(role);
          }
          return true;
        });
        return { ...item, subItems };
      }

      if (item.href === "/admin" && !roleAccess.canViewReports(role)) return null;

      return item;
    })
    .filter(Boolean) as MenuItem[];
}

export function filterStaffMenu<T extends { href?: string; title: string }>(
  items: T[],
  role?: UserRole
): T[] {
  return items.filter((item) => {
    if (item.href === "/staff/inventory") return roleAccess.canViewInventory(role);
    if (item.href === "/staff/products")
      return roleAccess.canCreateProduct(role) || roleAccess.canPublishProduct(role);
    if (item.href === "/staff/orders") return roleAccess.canManageOrders(role);
    if (item.href === "/staff/returns") return roleAccess.canProcessReturnStaff(role);
    if (item.href === "/staff/reviews") return roleAccess.canModerateReviews(role);
    return true;
  });
}
