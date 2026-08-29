import { useAppSelector } from "@/hooks/useRedux";
import { roleAccess } from "@/config/roleAccess";

export function useRoleAccess() {
  const role = useAppSelector((state) => state.auth.user?.role);

  return {
    role,
    ...roleAccess,
    access: {
      adminPortal: roleAccess.canAccessAdminPortal(role),
      staffPortal: roleAccess.canAccessStaffPortal(role),
      manageUsers: roleAccess.canManageUsers(role),
      manageRbac: roleAccess.canManageRbac(role),
      createProduct: roleAccess.canCreateProduct(role),
      editProduct: roleAccess.canEditProduct(role),
      approveProduct: roleAccess.canApproveProduct(role),
      publishProduct: roleAccess.canPublishProduct(role),
      deleteProduct: roleAccess.canDeleteProduct(role),
      brandsCategories: roleAccess.canManageBrandsCategories(role),
      viewInventory: roleAccess.canViewInventory(role),
      adjustInventory: roleAccess.canAdjustInventory(role),
      manageOrders: roleAccess.canManageOrders(role),
      moderateReviews: roleAccess.canModerateReviews(role),
      processReturnStaff: roleAccess.canProcessReturnStaff(role),
      approveReturn: roleAccess.canApproveReturn(role),
      viewReports: roleAccess.canViewReports(role),
    },
  };
}
