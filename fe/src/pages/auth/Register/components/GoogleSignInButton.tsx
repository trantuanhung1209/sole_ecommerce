import { GoogleLogin } from "@react-oauth/google";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { isGoogleAuthEnabled } from "@/config/env";

export const GoogleSignInButton = () => {
  const { handleGoogleSuccess, handleGoogleError } = useGoogleAuth();

  if (!isGoogleAuthEnabled) {
    return (
      <p className="w-full rounded-lg border border-dashed border-[#D1D5DB] bg-[#F7F7F5] px-4 py-3 text-center text-sm text-[#6B7280]">
        Google Sign-In chưa bật. Thêm <code className="text-xs">VITE_GOOGLE_CLIENT_ID</code> vào{" "}
        <code className="text-xs">.env</code> (cùng giá trị với <code className="text-xs">GOOGLE_CLIENT_ID</code>).
      </p>
    );
  }

  return (
    <div className="flex w-full items-center justify-center">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        useOneTap={false}
        size="large"
        text="signin_with"
        locale="vi"
        shape="rectangular"
        theme="outline"
      />
    </div>
  );
};
