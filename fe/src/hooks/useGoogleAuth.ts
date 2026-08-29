import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/hooks/useRedux";
import { authServices } from "@/services/authServices";
import { setAuth } from "@/store/slices/authSlice";
import { resolvePostLoginPath } from "@/utils/authRedirect";
import { toast } from "react-toastify";
import type { CredentialResponse } from "@react-oauth/google";

export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      toast.error("Không thể lấy thông tin từ Google");
      return;
    }

    setIsLoading(true);
    try {
      // Clear any existing cookies before Google auth
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });

      const response = await authServices.googleAuth(credentialResponse.credential);
      
      if (response.data) {
        dispatch(setAuth({ 
          user: response.data.user, 
          isLoggedIn: true 
        }));
        toast.success("Đăng nhập với Google thành công! Chào mừng bạn 🎉");
        navigate(resolvePostLoginPath(response.data.user.role), { replace: true });
      }
    } catch (error: any) {
      console.error("Google authentication failed:", error);
      toast.error(error.response?.data?.message || "Đăng nhập với Google thất bại. Vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error("Đăng nhập Google thất bại. Vui lòng thử lại hoặc sử dụng phương thức khác");
  };

  return {
    isLoading,
    handleGoogleSuccess,
    handleGoogleError,
  };
};
