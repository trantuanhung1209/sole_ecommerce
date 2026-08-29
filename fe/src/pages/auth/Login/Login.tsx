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
    <div className="relative min-h-screen lg:grid lg:grid-cols-2">
      <AuthPageBackground />
      <BackToHomeButton className="lg:left-auto lg:right-6" />

      <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-8">
        <Card className="w-full max-w-md border-[#E5E7EB] bg-white/95 shadow-[0_20px_60px_rgba(17,17,17,0.08)] backdrop-blur-sm animate-fade-in-up">
          <CardHeader className="space-y-4 pb-2 text-center">
            <div className="flex justify-center lg:hidden">
              <SoleLogo size="lg" />
            </div>
            <div className="hidden justify-center lg:flex">
              <SoleLogo size="md" />
            </div>
            <div>
              <CardTitle className="text-3xl font-black tracking-tight text-[#111111]">
                Chào mừng trở lại
              </CardTitle>
              <CardDescription className="mt-2 text-base text-[#6B7280]">
                Đăng nhập để mua sắm và theo dõi đơn hàng
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <ErrorAlert message={errorMessage} />

              <FormField
                id="email"
                label="Địa chỉ Email"
                type="email"
                placeholder="email@example.com"
                icon={<Mail size={18} />}
                error={errors.email}
                register={register("email")}
              />

              <PasswordField
                id="password"
                label="Mật khẩu"
                error={errors.password}
                register={register("password")}
                animationDelay="delay-100"
              />

              <div className="flex items-center justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-[#E53935] transition-colors hover:text-[#c62828] hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <Button
                type="submit"
                className="h-11 w-full bg-[#111111] font-semibold text-white shadow-lg transition-all hover:bg-[#111111]/90 hover:shadow-xl"
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

          <CardFooter className="flex flex-col space-y-4 pt-2">
            <div className="text-center text-sm text-[#6B7280]">
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
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-[#9CA3AF]">Hoặc tiếp tục với</span>
              </div>
            </div>

            <GoogleSignInButton />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
