import { AdminFilterBar } from "@/components/shared/AdminFilterBar";
import { useDebounce } from "@/hooks/useDebounce";
import { userServices } from "@/services/userServices";
import type { User, UserRole } from "@/types/user.type";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import EditUserDialog from "./components/EditUserDialog.tsx";
import UserTable from "./components/UserTable";
import { TablePagination } from "@/components/shared/TablePagination";
import { roleFilterOptions, userStatusFilterOptions } from "@/utils/adminFilterOptions";

function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(0);
  const [sortBy] = useState("createdAt");
  const [sortDir] = useState<"asc" | "desc">("desc");
  const itemsPerPage = 10;

  const fetchUsers = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        const response = await userServices.getAllUsersPaginated({
          page: currentPage,
          size: itemsPerPage,
          sortBy,
          sortDir,
          search: debouncedSearchQuery || undefined,
          role: roleFilter === "ALL" ? undefined : roleFilter,
          isActive:
            statusFilter === "ALL"
              ? undefined
              : statusFilter === "ACTIVE",
        });

        setUsers(response.content || []);
        setTotalElements(response.totalElements || 0);
        setTotalPages(response.totalPages || 0);
      } catch (error) {
        console.error("Error fetching users:", error);
        const errorMessage =
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Lỗi khi tải danh sách người dùng";
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [currentPage, debouncedSearchQuery, roleFilter, sortBy, sortDir, statusFilter]
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setCurrentPage(0);
  }, [debouncedSearchQuery, roleFilter, statusFilter]);

  const handleRefresh = useCallback(() => {
    fetchUsers(true);
  }, [fetchUsers]);

  const handleEditUser = useCallback((user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  }, []);

  const handleToggleStatus = useCallback(
    async (user: User) => {
      try {
        await userServices.toggleUserStatus(user.id);
        toast.success(
          `Đã ${user.isActive ? "vô hiệu hóa" : "kích hoạt"} người dùng`
        );
        fetchUsers(true);
      } catch (error) {
        console.error("Error toggling user status:", error);
        const errorMessage =
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Lỗi khi thay đổi trạng thái người dùng";
        toast.error(errorMessage);
      }
    },
    [fetchUsers]
  );

  const handleEditSuccess = useCallback(() => {
    setIsEditDialogOpen(false);
    setSelectedUser(null);
    fetchUsers(true);
  }, [fetchUsers]);

  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalElements);

  const resetFilters = () => {
    setSearchQuery("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
    setCurrentPage(0);
  };

  return (
    <div className="space-y-6">
      <AdminFilterBar
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Tìm kiếm theo tên, email, số điện thoại...",
        }}
        selects={[
          {
            id: "user-role",
            label: "Vai trò",
            value: roleFilter,
            onChange: (value) => setRoleFilter(value as UserRole | "ALL"),
            options: roleFilterOptions(),
          },
          {
            id: "user-status",
            label: "Trạng thái",
            value: statusFilter,
            onChange: setStatusFilter,
            options: userStatusFilterOptions(),
          },
        ]}
        onReset={resetFilters}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        resultText={`Hiển thị ${totalElements > 0 ? startIndex + 1 : 0}-${endIndex} / ${totalElements} người dùng`}
      />

      <UserTable
        users={users}
        isLoading={isLoading}
        onEditUser={handleEditUser}
        onToggleStatus={handleToggleStatus}
      />

      <TablePagination
        page={currentPage}
        totalPages={totalPages}
        totalElements={totalElements}
        onPageChange={setCurrentPage}
        className="mt-6"
      />

      {selectedUser && (
        <EditUserDialog
          user={selectedUser}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}

export default UserList;
