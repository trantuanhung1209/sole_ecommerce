import { GoogleLogin } from "@react-oauth/google";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { isGoogleAuthEnabled } from "@/config/env";

type GoogleSignInButtonProps = {
  size?: "large" | "medium" | "small";
};

export const GoogleSignInButton = ({ size = "large" }: GoogleSignInButtonProps) => {
  const { handleGoogleSuccess, handleGoogleError } = useGoogleAuth();

  if (!isGoogleAuthEnabled) {
    return (
      <p className="w-full rounded-lg border border-dashed border-[#D1D5DB] bg-[#F7F7F5] px-3 py-2 text-center text-xs leading-snug text-[#6B7280]">
        Google Sign-In chưa bật. Thêm <code className="text-[10px]">VITE_GOOGLE_CLIENT_ID</code> vào{" "}
        <code className="text-[10px]">.env</code>.
      </p>
    );
  }

  return (
    <div className="flex w-full items-center justify-center [&>div]:!w-full [&>div]:!justify-center">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        useOneTap={false}
        size={size}
        text="signin_with"
        locale="vi"
        shape="rectangular"
        theme="outline"
      />
    </div>
  );
};
