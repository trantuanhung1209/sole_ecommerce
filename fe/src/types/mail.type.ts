import type { ApiResponse } from "./api.type";

export interface SendEmailDto {
  email: string;
  otp: number;
}

// Response khi xác thực OTP thành công
export interface VerifyOtpData {
  user: {
    id: string;
    email: string;
    fullName: string;
    enabled: boolean;
    role: string;
  };
}

export type VerifyOtpApiResponse = ApiResponse<VerifyOtpData>;
