import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SoleLogo } from "@/components/brand/SoleLogo";
import { AuthPageBackground } from "@/components/layouts/Public/AuthPageBackground/AuthPageBackground";
import { BackToHomeButton } from "../Register/components/BackToHomeButton";
import { GoogleSignInButton } from "../Register/components";
import { FormField, PasswordField, ErrorAlert } from "./components";
import { useLoginForm } from "./hooks/useLoginForm";

const Login = () => {
  const { form, isLoading, errorMessage, onSubmit } = useLoginForm();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <div className="relative h-dvh max-h-dvh overflow-hidden lg:grid lg:grid-cols-2">
      <AuthPageBackground />
      <BackToHomeButton className="lg:left-auto lg:right-4 lg:top-4" />

      <div className="relative flex h-full min-h-0 items-center justify-center px-3 py-3 sm:px-4">
        <Card className="w-full max-w-[400px] border-[#E5E7EB] bg-white/95 shadow-[0_16px_48px_rgba(17,17,17,0.08)] backdrop-blur-sm animate-fade-in-up">
          <CardHeader className="space-y-2 px-5 pb-0 pt-5 text-center">
            <div className="flex justify-center lg:hidden">
              <SoleLogo size="sm" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black tracking-tight text-[#111111]">
                Chào mừng trở lại
              </CardTitle>
              <CardDescription className="mt-1 text-sm text-[#6B7280]">
                Đăng nhập để mua sắm và theo dõi đơn hàng
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-5 pb-3 pt-4">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-3 [&_input]:h-10 [&_label]:text-xs"
            >
              <ErrorAlert message={errorMessage} />

              <FormField
                id="email"
                label="Địa chỉ Email"
                type="email"
                placeholder="email@example.com"
                icon={<Mail size={16} />}
                error={errors.email}
                register={register("email")}
              />

              <PasswordField
                id="password"
                label="Mật khẩu"
                error={errors.password}
                register={register("password")}
              />

              <div className="flex items-center justify-end pt-0.5">
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-[#E53935] transition-colors hover:text-[#c62828] hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <Button
                type="submit"
                className="h-10 w-full bg-[#111111] text-sm font-semibold text-white shadow-md transition-all hover:bg-[#111111]/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Đang đăng nhập...
                  </div>
                ) : (
                  "Đăng nhập"
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 px-5 pb-5 pt-0">
            <div className="text-center text-xs text-[#6B7280]">
              Chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="font-semibold text-[#111111] transition-colors hover:text-[#E53935] hover:underline"
              >
                Đăng ký ngay
              </Link>
            </div>

            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#E5E7EB]" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white px-2 text-[#9CA3AF]">Hoặc tiếp tục với</span>
              </div>
            </div>

            <GoogleSignInButton size="medium" />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
