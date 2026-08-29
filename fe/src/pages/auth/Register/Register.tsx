import { Link } from "react-router-dom";
import { Mail, User } from "lucide-react";
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
import {
  FormField,
  PasswordField,
  GoogleSignInButton,
  OtpVerificationDialog,
  ErrorAlert,
} from "./components";
import { BackToHomeButton } from "./components/BackToHomeButton";
import { useRegisterForm } from "./hooks/useRegisterForm";

const Register = () => {
  const {
    form,
    isLoading,
    isOtpDialogOpen,
    registeredEmail,
    isVerifying,
    errorMessage,
    onSubmit,
    onVerifyOtp,
    setIsOtpDialogOpen,
  } = useRegisterForm();

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
            <div className="flex justify-center">
              <SoleLogo size="lg" />
            </div>
            <div>
              <CardTitle className="text-3xl font-black tracking-tight text-[#111111]">
                Tham gia SOLE
              </CardTitle>
              <CardDescription className="mt-2 text-base text-[#6B7280]">
                Tạo tài khoản để mua giày và quản lý đơn hàng
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

              <FormField
                id="fullName"
                label="Họ và Tên"
                type="text"
                placeholder="Nguyễn Văn A"
                icon={<User size={18} />}
                error={errors.fullName}
                register={register("fullName")}
                animationDelay="delay-150"
              />

              <PasswordField
                id="password"
                label="Mật khẩu"
                error={errors.password}
                register={register("password")}
                animationDelay="delay-200"
              />

              <PasswordField
                id="confirmPassword"
                label="Xác nhận mật khẩu"
                error={errors.confirmPassword}
                register={register("confirmPassword")}
                animationDelay="delay-300"
              />

              <Button
                type="submit"
                className="h-11 w-full bg-[#111111] font-semibold text-white shadow-lg transition-all hover:bg-[#111111]/90 hover:shadow-xl"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Đang tạo tài khoản...
                  </div>
                ) : (
                  "Tạo tài khoản"
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2">
            <div className="text-center text-sm text-[#6B7280]">
              Đã có tài khoản?{" "}
              <Link
                to="/login"
                className="font-semibold text-[#111111] transition-colors hover:text-[#E53935] hover:underline"
              >
                Đăng nhập
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

      <OtpVerificationDialog
        isOpen={isOtpDialogOpen}
        onClose={() => setIsOtpDialogOpen(false)}
        email={registeredEmail}
        isVerifying={isVerifying}
        onVerify={onVerifyOtp}
        errorMessage={errorMessage}
      />
    </div>
  );
};

export default Register;
