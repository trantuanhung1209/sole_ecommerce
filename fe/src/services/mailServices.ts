import type { SendEmailDto, VerifyOtpApiResponse } from "@/types/mail.type";
import publicAxios from "@/utils/publicAxios";

export const mailServices = {
  verifyOtp: async (data: SendEmailDto) => {
    const response = await publicAxios.post<VerifyOtpApiResponse>(
      "/auth/verify-otp",
      data
    );
    return response.data;
  },
};
