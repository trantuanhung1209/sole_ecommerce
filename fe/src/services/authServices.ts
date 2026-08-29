import type {
  RegisterDto,
  GetProfileResponseData,
  LoginDto,
  LoginResponseData,
  ForgotPasswordDto,
  ResetPasswordDto,
  UpdateProfileDto,
  ChangePasswordDto,
} from "@/types/auth.types";
import type { ApiMessageResponse, ApiResponse } from "@/types/api.type";
import publicAxios from "@/utils/publicAxios";
import authorizedAxios from "@/utils/authorizedAxios";

export const authServices = {
  register: async (data: RegisterDto) => {
    const response = await publicAxios.post<ApiMessageResponse>(
      "/auth/register",
      data
    );
    return response.data;
  },

  login: async (data: LoginDto) => {
    const response = await publicAxios.post<ApiResponse<LoginResponseData>>(
      "/auth/login",
      data
    );
    return response.data;
  },

  googleAuth: async (idToken: string) => {
    const response = await publicAxios.post<ApiResponse<LoginResponseData>>(
      "/auth/google",
      { idToken }
    );
    return response.data;
  },

  getProfile: async () => {
    const response = await authorizedAxios.get<
      ApiResponse<GetProfileResponseData>
    >("/auth/me");
    return response.data;
  },

  updateProfile: async (data: UpdateProfileDto) => {
    const response = await authorizedAxios.put<
      ApiResponse<GetProfileResponseData>
    >("/auth/profile", data);
    return response.data;
  },

  logout: async () => {
    const response = await publicAxios.post<ApiMessageResponse>("/auth/logout");
    return response.data;
  },

  refreshToken: async () => {
    const response = await publicAxios.post<ApiResponse<LoginResponseData>>(
      "/auth/refresh"
    );
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordDto) => {
    const response = await publicAxios.post<ApiMessageResponse>(
      "/auth/forgot-password",
      data
    );
    return response.data;
  },

  resetPassword: async (data: ResetPasswordDto) => {
    const response = await publicAxios.post<ApiMessageResponse>(
      "/auth/reset-password",
      data
    );
    return response.data;
  },

  changePassword: async (data: ChangePasswordDto) => {
    const response = await authorizedAxios.post<ApiMessageResponse>(
      "/auth/change-password",
      data
    );
    return response.data;
  },

  listSessions: async () => {
    const response = await authorizedAxios.get<
      ApiResponse<
        {
          sessionId: string;
          userAgent?: string;
          ip?: string;
          createdAt: string;
          expiresAt?: string;
          current?: boolean;
        }[]
      >
    >("/auth/sessions");
    return response.data.data;
  },

  revokeSession: async (sessionId: string) => {
    await authorizedAxios.delete(`/auth/sessions/${sessionId}`);
  },

  revokeOtherSessions: async () => {
    await authorizedAxios.delete("/auth/sessions");
  },
};
