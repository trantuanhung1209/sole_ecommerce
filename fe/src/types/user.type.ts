export const UserRole = {
  CUSTOMER: "CUSTOMER",
  STAFF: "STAFF",
  SHOP_MANAGER: "SHOP_MANAGER",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const AuthProviderType = {
  LOCAL: "LOCAL",
  GOOGLE: "GOOGLE",
  BOTH: "BOTH",
} as const;

export type AuthProviderType =
  (typeof AuthProviderType)[keyof typeof AuthProviderType];

export const Gender = {
  MALE: "MALE",
  FEMALE: "FEMALE",
  OTHER: "OTHER",
} as const;

export type Gender = (typeof Gender)[keyof typeof Gender];

export interface User {
  id: string;
  fullName: string;
  email: string;
  password?: string | null;
  authType?: AuthProviderType;
  avatar?: string | null;
  connectedAt?: string | null;
  enabled: boolean;
  isEmailVerified?: boolean;
  isActive?: boolean;
  role: UserRole;
  phone?: string | null;
  gender?: Gender | null;
  dateOfBirth?: string | null;
  lastLoginAt?: string | null;
  address?: string | null;
  googleAuth?: {
    email: string;
    name: string;
    picture: string;
    connectedAt: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateUserDto {
  fullName?: string;
  phone?: string;
  gender?: Gender;
  dateOfBirth?: string;
  role?: UserRole;
  isActive?: boolean;
}
