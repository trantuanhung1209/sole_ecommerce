import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Mail, KeyRound, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, PasswordField, ErrorAlert } from "./components";
import { authServices } from "@/services/authServices";
import { toast } from "react-toastify";
import { SoleLogo } from "@/components/brand/SoleLogo";
import { AuthPageBackground } from "@/components/layouts/Public/AuthPageBackground/AuthPageBackground";
import { BackToHomeButton } from "../Register/components/BackToHomeButton";

// Validation schemas
const emailSchema = z.object({
  email: z.string().email("Email không hợp lệ").min(1, "Email là bắt buộc"),
});

const resetPasswordSchema = z
  .object({
    otp: z.string().min(6, "OTP phải có 6 chữ số").max(6, "OTP phải có 6 chữ số"),
    newPassword: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự").max(20, "Mật khẩu không quá 20 ký tự"),
    confirmPassword: z.string().min(1, "Xác nhận mật khẩu là bắt buộc"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });

type EmailFormData = z.infer<typeof emailSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const ForgotPassword = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  // Form for step 1: Email
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  // Form for step 2: OTP and new password
  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Handle step 1: Send OTP
  const handleSendOtp = async (data: EmailFormData) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await authServices.forgotPassword(data);
      toast.success(response.message || "Đã gửi OTP đến email của bạn");
      setEmail(data.email);
      setStep(2);
    } catch (error: any) {
      const message = error?.response?.data?.message || "Gửi OTP thất bại. Vui lòng thử lại.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle step 2: Reset password
  const handleResetPassword = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await authServices.resetPassword(data);
      toast.success(response.message || "Đặt lại mật khẩu thành công");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error: any) {
      const message = error?.response?.data?.message || "Đặt lại mật khẩu thất bại. Vui lòng thử lại.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-2">
      <AuthPageBackground />
      <BackToHomeButton className="lg:left-auto lg:right-6" />

      <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-8">
        <Card className="w-full max-w-md border-[#E5E7EB] bg-white/95 shadow-[0_20px_60px_rgba(17,17,17,0.08)] backdrop-blur-sm animate-fade-in-up">
          <CardHeader className="space-y-4 pb-2">
            <div className="flex justify-center">
              <SoleLogo size="md" />
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-[#6B7280] transition-colors hover:text-[#111111]"
              >
                <ArrowLeft size={20} />
              </Link>
              <CardTitle className="text-2xl font-black text-[#111111]">Quên mật khẩu</CardTitle>
            </div>
            <CardDescription className="text-base text-[#6B7280]">
              {step === 1
                ? "Nhập email của bạn để nhận mã OTP"
                : "Nhập mã OTP và mật khẩu mới"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 1 ? (
              <form onSubmit={emailForm.handleSubmit(handleSendOtp)} className="space-y-4">
                <ErrorAlert message={errorMessage} />
                <FormField
                  id="email"
                  label="Địa chỉ Email"
                  type="email"
                  placeholder="email@example.com"
                  icon={<Mail size={18} />}
                  error={emailForm.formState.errors.email}
                  register={emailForm.register("email")}
                />
                <Button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang gửi OTP...
                    </div>
                  ) : (
                    "Gửi mã OTP"
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-4">
                <ErrorAlert message={errorMessage} />
                <div className="mb-4 rounded-lg border border-[#E5E7EB] bg-[#F7F7F5] p-3">
                  <p className="text-sm text-[#6B7280]">
                    Mã OTP đã được gửi đến <strong className="text-[#111111]">{email}</strong>
                  </p>
                </div>
                <FormField
                  id="otp"
                  label="Mã OTP"
                  type="text"
                  placeholder="Nhập mã 6 chữ số"
                  icon={<KeyRound size={18} />}
                  error={resetForm.formState.errors.otp}
                  register={resetForm.register("otp")}
                  maxLength={6}
                />
                <PasswordField
                  id="newPassword"
                  label="Mật khẩu mới"
                  error={resetForm.formState.errors.newPassword}
                  register={resetForm.register("newPassword")}
                  animationDelay="delay-100"
                />
                <PasswordField
                  id="confirmPassword"
                  label="Xác nhận mật khẩu"
                  error={resetForm.formState.errors.confirmPassword}
                  register={resetForm.register("confirmPassword")}
                  animationDelay="delay-200"
                />
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-11"
                    onClick={() => {
                      setStep(1);
                      setErrorMessage(null);
                      resetForm.reset();
                    }}
                    disabled={isLoading}
                  >
                    Quay lại
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang xử lý...
                      </div>
                    ) : (
                      "Đặt lại mật khẩu"
                    )}
                  </Button>
                </div>
              </form>
            )}

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Đã nhớ mật khẩu?{" "}
                <Link
                  to="/login"
                  className="text-primary font-medium hover:text-primary/80 hover:underline transition-colors"
                >
                  Đăng nhập
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
