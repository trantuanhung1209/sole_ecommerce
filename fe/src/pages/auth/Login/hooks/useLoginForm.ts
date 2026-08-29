import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authServices } from "@/services/authServices";
import type { LoginDto } from "@/types/auth.types";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { loginSchema, type LoginFormData } from "@/schemas/loginSchema";
import { setAuth } from "@/store/slices/authSlice";
import { resolvePostLoginPath } from "@/utils/authRedirect";
import { toast } from "react-toastify";

export const useLoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const loginData: LoginDto = {
        email: data.email,
        password: data.password,
      };

      const response = await authServices.login(loginData);

      if (response.data?.user) {
        // Lưu thông tin user vào Redux store và localStorage
        dispatch(
          setAuth({
            user: response.data.user,
            isLoggedIn: true,
          })
        );

        // Show success toast
        toast.success("Đăng nhập thành công! Chào mừng bạn trở lại 🎉", {
          position: "top-center",
          autoClose: 2000,
        });

        const returnUrl = searchParams.get("returnUrl");
        navigate(resolvePostLoginPath(response.data.user.role, returnUrl), { replace: true });
      }
    } catch (error) {
      const message = getErrorMessage(error);
      
      // Check if error is due to unverified email - redirect to register
      if (message.includes("Tài khoản chưa được xác thực")) {
        setErrorMessage(message);
        
        // Show toast with instruction
        toast.info("Vui lòng đăng ký lại để nhận mã xác thực mới", {
          position: "top-center",
          autoClose: 3000,
        });
        
        // Redirect to register page after a short delay
        setTimeout(() => {
          navigate("/register");
        }, 2000);
      } else {
        setErrorMessage(message);
      }
      
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    isLoading,
    errorMessage,
    onSubmit,
    setErrorMessage,
  };
};
