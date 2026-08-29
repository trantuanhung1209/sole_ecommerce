import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface FormFieldProps {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  icon: ReactNode;
  error?: FieldError;
  register: UseFormRegisterReturn;
  rightIcon?: ReactNode;
  animationDelay?: string;
  maxLength?: number;
}

export const FormField = ({
  id,
  label,
  type,
  placeholder,
  icon,
  error,
  register,
  rightIcon,
  animationDelay = "",
  maxLength,
}: FormFieldProps) => {
  return (
    <div className={`space-y-2 animate-slide-in-left ${animationDelay}`}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </div>
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`pl-10 ${
            rightIcon ? "pr-10" : ""
          } h-10 border-blue-200 focus:border-blue-500`}
          {...register}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-destructive animate-fade-in">
          {error.message}
        </p>
      )}
    </div>
  );
};
