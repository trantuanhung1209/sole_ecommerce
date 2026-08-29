import { UserRole, type UserRole as UserRoleType } from "@/types/user.type";

/** Mirrors backend @PreAuthorize + SecurityConfig for SOLE e-commerce. */
export const roleAccess = {
  canAccessAdminPortal: (role?: UserRoleType) =>
    role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN,

  canAccessStaffPortal: (role?: UserRoleType) =>
    role === UserRole.STAFF ||
    role === UserRole.SHOP_MANAGER ||
    role === UserRole.ADMIN ||
    role === UserRole.SUPER_ADMIN,

  canManageUsers: (role?: UserRoleType) =>
    role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN,

  canManageRbac: (role?: UserRoleType) => role === UserRole.SUPER_ADMIN,

  canCreateProduct: (role?: UserRoleType) =>
    role === UserRole.STAFF || role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN,

  canEditProduct: (role?: UserRoleType) =>
    role === UserRole.STAFF || role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN,

  canApproveProduct: (role?: UserRoleType) =>
    role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN,

  canPublishProduct: (role?: UserRoleType) =>
    role === UserRole.SHOP_MANAGER || role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN,

  canDeleteProduct: (role?: UserRoleType) =>
    role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN,

  canManageBrandsCategories: (role?: UserRoleType) =>
    role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN,

  canViewInventory: (role?: UserRoleType) =>
    role === UserRole.STAFF ||
    role === UserRole.SHOP_MANAGER ||
    role === UserRole.ADMIN ||
    role === UserRole.SUPER_ADMIN,

  canAdjustInventory: (role?: UserRoleType) =>
    role === UserRole.SHOP_MANAGER || role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN,

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
  canApproveReturn: (role?: UserRoleType) =>
    role === UserRole.SHOP_MANAGER || role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN,

  canViewReports: (role?: UserRoleType) =>
    role === UserRole.SHOP_MANAGER || role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN,

  isCustomerFacing: (role?: UserRoleType) =>
    !role || role === UserRole.CUSTOMER,
};

export function getDefaultPortalPath(role?: UserRoleType): string {
  if (roleAccess.canAccessAdminPortal(role)) return "/admin";
  if (role === UserRole.STAFF || role === UserRole.SHOP_MANAGER) return "/staff";
  return "/";
}
