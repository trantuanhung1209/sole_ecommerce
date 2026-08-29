import { Outlet, useLocation } from "react-router-dom";
import { FloatingChatbot } from "@/components/FloatingChatbot";

export default function RootLayout() {
  const location = useLocation();

  const hideOnPaths = ["/login", "/register", "/forgot-password", "/admin", "/staff"];
  const shouldHideChatbot = hideOnPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  return (
    <>
      <Outlet />
      {!shouldHideChatbot && <FloatingChatbot />}
    </>
  );
}
