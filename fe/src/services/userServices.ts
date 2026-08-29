import type { User, UpdateUserDto } from "@/types/user.type";
import type { ApiResponse } from "@/types/api.type";
import authorizedAxios from "@/utils/authorizedAxios";

export const userServices = {
  // Get all users (admin only)
  getAllUsers: async () => {
    const response = await authorizedAxios.get<ApiResponse<User[]>>(
      "/admin/users"
    );
    return response.data;
  },

  // Get all users with pagination (admin only)
  getAllUsersPaginated: async (params?: {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: "asc" | "desc";
    search?: string;
    role?: string;
    isActive?: boolean;
  }) => {
    const response = await authorizedAxios.get<
      ApiResponse<{
        content: User[];
        page: number;
        size: number;
        totalElements: number;
        totalPages: number;
        first: boolean;
        last: boolean;
        empty: boolean;
      }>
    >("/admin/users", {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 10,
        sortBy: params?.sortBy ?? "createdAt",
        sortDir: params?.sortDir ?? "desc",
        search: params?.search || undefined,
        role: params?.role && params.role !== "ALL" ? params.role : undefined,
        isActive:
          params?.isActive === undefined
            ? undefined
            : params.isActive,
      },
    });
    return response.data.data;
  },

  // Get user by ID
  getUserById: async (userId: string) => {
    const response = await authorizedAxios.get<ApiResponse<User>>(
      `/admin/users/${userId}`
    );
    return response.data;
  },

  // Update user information
  updateUser: async (userId: string, data: UpdateUserDto) => {
    const response = await authorizedAxios.put<ApiResponse<User>>(
      `/admin/users/${userId}`,
      data
    );
    return response.data;
  },

  // Toggle user active status
  toggleUserStatus: async (userId: string) => {
    const response = await authorizedAxios.patch<ApiResponse<User>>(
      `/admin/users/${userId}/toggle-status`
    );
    return response.data;
  },
};
