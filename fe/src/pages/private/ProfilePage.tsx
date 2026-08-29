import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Save, X, User as UserIcon, Mail, Phone, Calendar, Shield, Lock } from "lucide-react";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { updateProfile } from "@/store/slices";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { profileSchema, type ProfileFormData } from "@/schemas/profileSchema";
import { Gender } from "@/types/user.type";
import ChangePasswordDialog from "@/components/ChangePasswordDialog";
import { SessionsPanel } from "@/components/profile/SessionsPanel";
import { getRoleLabel } from "@/utils/displayLabels";

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((state) => state.auth);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      phone: user?.phone || "",
      gender: user?.gender || undefined,
    },
  });

  const selectedGender = watch("gender");

  // Set initial values when user data loads (only run once on mount or when user changes)
  useEffect(() => {
    if (user) {
      setValue("fullName", user.fullName || "");
      setValue("phone", user.phone || "");
      setValue("gender", user.gender || undefined);
    }
  }, [user?.id, setValue]); // Only depend on user ID to avoid infinite loop

  // Update avatar preview when user.avatar changes from server (after upload success)
  useEffect(() => {
    if (user?.avatar && !avatarFile) {
      setImagePreview(user.avatar);
    }
  }, [user?.avatar]); // Only update when server avatar URL changes

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Chỉ hỗ trợ file ảnh JPG, PNG, WEBP");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    setAvatarFile(file);

    // Revoke old blob URL if exists
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }

    // Create object URL for LOCAL preview only
    const objectUrl = URL.createObjectURL(file);
    setBlobUrl(objectUrl);
    setImagePreview(objectUrl);
    // No Redux dispatch - wait for server response
  };

  const handleRemoveImage = () => {
    // Revoke the blob URL to free memory
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }
    setImagePreview(user?.avatar || null);
    setAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // Extract base64 data without the data URL prefix
        const base64Data = base64.split(",")[1];
        resolve(`data:${file.type};base64,${base64Data}`);
      };
      reader.onerror = reject;
    });
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const updateData: any = {
        fullName: data.fullName?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        gender: data.gender || undefined,
      };

      // Handle avatar upload
      if (avatarFile) {
        const base64Avatar = await convertToBase64(avatarFile);
        updateData.avatar = base64Avatar;
      }

      // Remove empty values
      Object.keys(updateData).forEach((key) => {
        if (
          updateData[key as keyof ProfileFormData] === undefined ||
          updateData[key as keyof ProfileFormData] === "" ||
          updateData[key as keyof ProfileFormData] === null
        ) {
          delete updateData[key as keyof ProfileFormData];
        }
      });

      await dispatch(updateProfile(updateData)).unwrap();
      toast.success("Cập nhật hồ sơ thành công!");
      
      // Revoke blob URL if exists
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      
      // Clear local file after successful upload
      setAvatarFile(null);
      // Avatar will be updated by useEffect when user.avatar changes from server
    } catch (error: unknown) {
      console.error("Failed to update profile:", error);
      toast.error("Cập nhật hồ sơ thất bại. Vui lòng thử lại!");
    }
  };

  const roleLabel = (role: string) => getRoleLabel(role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Hồ Sơ Của Tôi
          </h1>
          <p className="text-muted-foreground text-lg">
            Quản lý thông tin cá nhân và ảnh đại diện của bạn
          </p>
        </div>

        {/* Profile Card */}
        <Card className="backdrop-blur-sm bg-card/90 border-2 shadow-2xl animate-fade-in-up delay-150">
          <div className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-6">
                <div className="relative group">
                  <Avatar className="h-32 w-32 ring-4 ring-primary/30 transition-all duration-300 group-hover:ring-primary/60 group-hover:scale-105 shadow-xl">
                    <AvatarImage
                      src={imagePreview || user?.avatar || undefined}
                      alt={user?.fullName}
                      referrerPolicy="no-referrer"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground text-3xl font-bold">
                      {getInitials(user?.fullName || "U")}
                    </AvatarFallback>
                  </Avatar>

                  {/* Camera button overlay */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                  >
                    <Camera className="h-8 w-8 text-white" />
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="hover:bg-primary/10"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Thay đổi ảnh
                  </Button>
                  {avatarFile && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="hover:bg-destructive/10 text-destructive"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Hủy
                    </Button>
                  )}
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Định dạng: JPG, PNG, WEBP • Kích thước tối đa: 5MB
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-border/50" />

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-primary" />
                    Họ và tên
                  </Label>
                  <Input
                    id="fullName"
                    {...register("fullName")}
                    placeholder="Nhập họ và tên"
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive animate-shake">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                {/* Email (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted/50 cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email không thể thay đổi
                  </p>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    Số điện thoại
                  </Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    placeholder="Nhập số điện thoại"
                    className="transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive animate-shake">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <Label htmlFor="gender" className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-primary" />
                    Giới tính
                  </Label>
                  <Select
                    value={selectedGender || undefined}
                    onValueChange={(value) => setValue("gender", value as Gender, { shouldDirty: true })}
                  >
                    <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/50">
                      <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Gender.MALE}>Nam</SelectItem>
                      <SelectItem value={Gender.FEMALE}>Nữ</SelectItem>
                      <SelectItem value={Gender.OTHER}>Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Role (Read-only) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Vai trò
                  </Label>
                  <div className="flex items-center h-10 px-3 py-2 rounded-md border border-input bg-muted/50">
                    <span className="text-sm font-medium">
                      {roleLabel(user?.role || "")}
                    </span>
                  </div>
                </div>

                {/* Last Login (Read-only) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Đăng nhập lần cuối
                  </Label>
                  <div className="flex items-center h-10 px-3 py-2 rounded-md border border-input bg-muted/50">
                    <span className="text-sm">
                      {user?.lastLoginAt || "Chưa có thông tin"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border/50" />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                {/* Change Password Button - Left side */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="hover:bg-primary/10 border-primary/50"
                  disabled={user?.authType === "GOOGLE"}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Đổi mật khẩu
                </Button>

                {/* Save/Cancel - Right side */}
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                    className="hover:bg-accent/50"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || (!isDirty && !avatarFile)}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Lưu thay đổi
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </Card>

        <Card className="p-6">
          <SessionsPanel />
        </Card>

        {/* Change Password Dialog */}
        <ChangePasswordDialog
          open={isChangePasswordOpen}
          onOpenChange={setIsChangePasswordOpen}
        />
      </div>
    </div>
  );
}
