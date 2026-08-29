import * as z from "zod";

// Zod schema validation - đồng bộ với backend
export const registerSchema = z
  .object({
    email: z.string().min(1, "Email là bắt buộc").email("Email không hợp lệ"),
    fullName: z
      .string()
      .min(6, "Họ tên phải từ 6 đến 50 ký tự")
      .max(50, "Họ tên phải từ 6 đến 50 ký tự"),
    password: z
      .string()
      .min(6, "Mật khẩu phải từ 6 đến 50 ký tự")
      .max(50, "Mật khẩu phải từ 6 đến 50 ký tự"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
