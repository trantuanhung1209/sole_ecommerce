import type { User } from "./user.type";

// API DTOs
export interface RegisterDto {
  fullName: string;
  email: string;
  password: string;
}

// Login types
export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponseData {
  user: User;
}

export type GetProfileResponseData = User;

export interface RefreshTokenResponseData {
  user: User;
}

export interface VerificationState {
  isVerificationSent: boolean;
  countdown: number;
}

export interface PasswordVisibility {
  showPassword: boolean;
  showConfirmPassword: boolean;
}

export interface UpdateProfileDto {
  fullName?: string;
  phone?: string;
  gender?: string;
  avatar?: string; // base64 string for upload
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  otp: string;
  newPassword: string;
  confirmPassword: string;
}
