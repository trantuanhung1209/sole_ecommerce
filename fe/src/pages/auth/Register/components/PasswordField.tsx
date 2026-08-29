import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { FormField } from "./FormField";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface PasswordFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  error?: FieldError;
  register: UseFormRegisterReturn;
  animationDelay?: string;
}

export const PasswordField = ({
  id,
  label,
  placeholder = "••••••••",
  error,
  register,
  animationDelay,
}: PasswordFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleButton = (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="text-muted-foreground hover:text-foreground transition-colors"
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );

  return (
    <FormField
      id={id}
      label={label}
      type={showPassword ? "text" : "password"}
      placeholder={placeholder}
      icon={<Lock size={18} />}
      error={error}
      register={register}
      rightIcon={toggleButton}
      animationDelay={animationDelay}
    />
  );
};
