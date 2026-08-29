import { z } from "zod";
import { Gender, UserRole } from "@/types/user.type";

const roleValues = [
  UserRole.CUSTOMER,
  UserRole.STAFF,
  UserRole.SHOP_MANAGER,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
] as const;

export const updateUserSchema = z.object({
  fullName: z.string().min(2, "Tên phải có ít nhất 2 ký tự").optional(),
  phone: z
    .string()
    .regex(/^[0-9]{10,11}$/, "Số điện thoại phải có 10-11 chữ số")
    .optional()
    .or(z.literal("")),
  gender: z
    .enum([Gender.MALE, Gender.FEMALE, Gender.OTHER])
    .optional()
    .nullable(),
  dateOfBirth: z.string().optional().nullable(),
  role: z.enum(roleValues).optional(),
  isActive: z.boolean().optional(),
}).refine((data) => {
  const staffRoles: string[] = [UserRole.STAFF, UserRole.SHOP_MANAGER];
  if (data.role && staffRoles.includes(data.role)) {
    return data.phone && data.phone.trim() !== "" && /^[0-9]{10,11}$/.test(data.phone);
  }
  return true;
}, {
  message: "Số điện thoại là bắt buộc khi nâng quyền lên Nhân viên",
  path: ["phone"],
});

export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
