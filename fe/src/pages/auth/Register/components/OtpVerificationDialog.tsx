import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorAlert } from "./ErrorAlert";
import { authServices } from "@/services/authServices";
import { getErrorMessage } from "@/utils/getErrorMessage";
import type { RegisterDto } from "@/types/auth.types";

const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "Mã OTP phải có 6 chữ số")
    .regex(/^\d+$/, "Mã OTP chỉ chứa số"),
});

type OtpFormData = z.infer<typeof otpSchema>;

interface OtpVerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  isVerifying: boolean;
  onVerify: (otp: string) => Promise<void>;
  errorMessage: string;
}

export const OtpVerificationDialog = ({
  isOpen,
  onClose,
  email,
  isVerifying,
  onVerify,
  errorMessage,
}: OtpVerificationDialogProps) => {
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  const onSubmit = async (data: OtpFormData) => {
    await onVerify(data.otp);
  };

  const handleResend = async () => {
    setIsResending(true);
    setResendMessage("");
    try {
      // Only need email - backend will find existing user and resend OTP
      const registerData: RegisterDto = {
        email,
        fullName: "", // Not needed for resend
        password: "", // Not needed for resend
      };
      
      await authServices.register(registerData);
      setResendMessage("Mã OTP đã được gửi lại thành công!");
      reset();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setResendMessage("");
      }, 3000);
    } catch (error) {
      const message = getErrorMessage(error);
      setResendMessage(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Xác thực Email
          </DialogTitle>
          <DialogDescription className="text-center">
            Chúng tôi đã gửi mã gồm 6 chữ số đến{" "}
            <span className="font-semibold text-foreground">{email}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Error Alert */}
          <ErrorAlert message={errorMessage} />
          
          {/* Resend Success Message */}
          {resendMessage && !errorMessage && (
            <div className="rounded-md bg-green-50 dark:bg-green-950/20 p-3 border border-green-200 dark:border-green-800 animate-fade-in">
              <p className="text-sm text-green-800 dark:text-green-200 text-center">
                {resendMessage}
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="otp" className="text-sm font-medium">
              Nhập mã OTP
            </Label>
            <Input
              id="otp"
              type="text"
              placeholder="000000"
              maxLength={6}
              className="text-center text-2xl tracking-widest font-mono h-14 border-blue-200"
              {...register("otp")}
            />
            {errors.otp && (
              <p className="text-xs text-destructive text-center animate-fade-in">
                {errors.otp.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isVerifying}
          >
            {isVerifying ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang xác thực...
              </div>
            ) : (
              "Xác thực Email"
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              className="text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleResend}
              disabled={isResending || isVerifying}
            >
              {isResending ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  Đang gửi lại...
                </span>
              ) : (
                "Không nhận được mã? Gửi lại"
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
