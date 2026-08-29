import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch } from "react-redux";
import { authServices } from "@/services/authServices";
import { mailServices } from "@/services/mailServices";
import type { RegisterDto } from "@/types/auth.types";
import type { SendEmailDto } from "@/types/mail.type";
import { getErrorMessage } from "@/utils/getErrorMessage";
import {
  registerSchema,
  type RegisterFormData,
} from "@/schemas/registerSchema";
import { setAuth } from "@/store/slices/authSlice";

export const useRegisterForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpDialogOpen, setIsOtpDialogOpen] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const dispatch = useDispatch();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const registerData: RegisterDto = {
        email: data.email,
        fullName: data.fullName,
        password: data.password,
      };

      await authServices.register(registerData);
      setRegisteredEmail(data.email);
      setIsOtpDialogOpen(true);
      // Clear any previous errors when successfully opening OTP dialog
      setErrorMessage("");
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyOtp = async (otp: string) => {
    setIsVerifying(true);
    setErrorMessage("");
    try {
      const otpData: SendEmailDto = {
        email: registeredEmail,
        otp: parseInt(otp),
      };

      const response = await mailServices.verifyOtp(otpData);

      if (response.data?.user) {
        // Dừng loading trước để UI success hiển thị
        setIsVerifying(false);
        setVerificationSuccess(true);

        // Lưu thông tin user vào Redux store và localStorage
        dispatch(
          setAuth({
            user: response.data.user,
            isLoggedIn: true,
          })
        );

        return; // Thoát sớm để không chạy finally
      }
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      console.error("OTP verification error:", error);
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    form,
    isLoading,
    isOtpDialogOpen,
    registeredEmail,
    isVerifying,
    verificationSuccess,
    errorMessage,
    onSubmit,
    onVerifyOtp,
    setIsOtpDialogOpen,
    setErrorMessage,
  };
};
