import { UserRole, type UserRole as UserRoleType } from "@/types/user.type";

/** Mirrors backend @PreAuthorize + SecurityConfig for SOLE e-commerce. */
export const roleAccess = {
  hasPermission: (permissions: string[] | undefined, code: string) =>
    permissions?.includes(code) ?? false,

  canAccessAdminPortal: (role?: UserRoleType, permissions?: string[]) =>
    role === UserRole.ADMIN ||
    role === UserRole.SUPER_ADMIN ||
    roleAccess.hasPermission(permissions, "SYSTEM_SETTINGS"),

  canAccessStaffPortal: (role?: UserRoleType) =>
    role === UserRole.STAFF ||
    role === UserRole.SHOP_MANAGER ||
    role === UserRole.ADMIN ||
    role === UserRole.SUPER_ADMIN,

  canManageUsers: (role?: UserRoleType, permissions?: string[]) =>
    role === UserRole.ADMIN ||
    role === UserRole.SUPER_ADMIN ||
    roleAccess.hasPermission(permissions, "USER_UPDATE"),

  canManageRbac: (role?: UserRoleType, permissions?: string[]) =>
    role === UserRole.SUPER_ADMIN ||
    roleAccess.hasPermission(permissions, "MANAGE_ROLE_PERMISSIONS"),

  canCreateProduct: (role?: UserRoleType, permissions?: string[]) =>
    role === UserRole.STAFF ||
    role === UserRole.ADMIN ||
    role === UserRole.SUPER_ADMIN ||
    roleAccess.hasPermission(permissions, "CATALOG_CREATE"),

  canEditProduct: (role?: UserRoleType, permissions?: string[]) =>
    role === UserRole.STAFF ||
    role === UserRole.ADMIN ||
    role === UserRole.SUPER_ADMIN ||
    roleAccess.hasPermission(permissions, "CATALOG_UPDATE"),

  canApproveProduct: (role?: UserRoleType, permissions?: string[]) =>
    role === UserRole.ADMIN ||
    role === UserRole.SUPER_ADMIN ||
    role === UserRole.SHOP_MANAGER ||
    roleAccess.hasPermission(permissions, "CATALOG_APPROVE"),

  canPublishProduct: (role?: UserRoleType, permissions?: string[]) =>
    role === UserRole.SHOP_MANAGER ||
    role === UserRole.ADMIN ||
    role === UserRole.SUPER_ADMIN,

  canDeleteProduct: (role?: UserRoleType) =>
    role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN,

  canManageBrandsCategories: (role?: UserRoleType) =>
    role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN,

  canViewInventory: (role?: UserRoleType) =>
    role === UserRole.STAFF ||
    role === UserRole.SHOP_MANAGER ||
    role === UserRole.ADMIN ||
    role === UserRole.SUPER_ADMIN,

  canAdjustInventory: (role?: UserRoleType, permissions?: string[]) =>
    role === UserRole.SHOP_MANAGER ||
    role === UserRole.ADMIN ||
    role === UserRole.SUPER_ADMIN ||
    roleAccess.hasPermission(permissions, "INVENTORY_UPDATE"),

  canManageOrders: (role?: UserRoleType) =>
    role === UserRole.STAFF ||
    role === UserRole.SHOP_MANAGER ||
    role === UserRole.ADMIN ||
    role === UserRole.SUPER_ADMIN,

  canModerateReviews: (role?: UserRoleType) =>
    role === UserRole.STAFF ||
    role === UserRole.SHOP_MANAGER ||
    role === UserRole.ADMIN ||
    role === UserRole.SUPER_ADMIN,

  /** Staff: confirm/reject return request */
  canProcessReturnStaff: (role?: UserRoleType) =>
    role === UserRole.STAFF ||
    role === UserRole.SHOP_MANAGER ||
    role === UserRole.ADMIN ||
    role === UserRole.SUPER_ADMIN,

  /** Shop manager+: approve refund */
  canApproveReturn: (role?: UserRoleType, permissions?: string[]) =>
    role === UserRole.SHOP_MANAGER ||
    role === UserRole.ADMIN ||
    role === UserRole.SUPER_ADMIN ||
    roleAccess.hasPermission(permissions, "RETURN_PROCESS"),

  canViewReports: (role?: UserRoleType, permissions?: string[]) =>
    role === UserRole.SHOP_MANAGER ||
    role === UserRole.ADMIN ||
    role === UserRole.SUPER_ADMIN ||
    roleAccess.hasPermission(permissions, "REPORT_READ"),

  isCustomerFacing: (role?: UserRoleType) =>
    !role || role === UserRole.CUSTOMER,
};

export function getDefaultPortalPath(role?: UserRoleType): string {
  if (roleAccess.canAccessAdminPortal(role)) return "/admin";
  if (role === UserRole.STAFF || role === UserRole.SHOP_MANAGER) return "/staff";
  return "/";
}
