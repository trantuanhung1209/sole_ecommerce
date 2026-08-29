import { useAppSelector } from "@/hooks/useRedux";
import { roleAccess } from "@/config/roleAccess";

export function useRoleAccess() {
  const user = useAppSelector((state) => state.auth.user);
  const role = user?.role;
  const permissions = user?.permissions;

  return {
    role,
    permissions,
    ...roleAccess,
    access: {
      adminPortal: roleAccess.canAccessAdminPortal(role, permissions),
      staffPortal: roleAccess.canAccessStaffPortal(role),
      manageUsers: roleAccess.canManageUsers(role, permissions),
      manageRbac: roleAccess.canManageRbac(role, permissions),
      createProduct: roleAccess.canCreateProduct(role, permissions),
      editProduct: roleAccess.canEditProduct(role, permissions),
      approveProduct: roleAccess.canApproveProduct(role, permissions),
      publishProduct: roleAccess.canPublishProduct(role, permissions),
      deleteProduct: roleAccess.canDeleteProduct(role),
      brandsCategories: roleAccess.canManageBrandsCategories(role),
      viewInventory: roleAccess.canViewInventory(role),
      adjustInventory: roleAccess.canAdjustInventory(role, permissions),
      manageOrders: roleAccess.canManageOrders(role),
      moderateReviews: roleAccess.canModerateReviews(role),
      processReturnStaff: roleAccess.canProcessReturnStaff(role),
      approveReturn: roleAccess.canApproveReturn(role, permissions),
      viewReports: roleAccess.canViewReports(role, permissions),
    },
  };
}
