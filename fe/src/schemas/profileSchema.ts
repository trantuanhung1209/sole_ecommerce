import { z } from "zod";
import { Gender } from "@/types/user.type";

export const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Họ tên phải có ít nhất 2 ký tự")
    .max(100, "Họ tên không được vượt quá 100 ký tự")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .regex(/^[0-9]{10,11}$/, "Số điện thoại phải có 10-11 chữ số")
    .optional()
    .or(z.literal("")),
  gender: z
    .enum([Gender.MALE, Gender.FEMALE, Gender.OTHER])
    .optional()
    .nullable(),
  avatar: z.string().optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
