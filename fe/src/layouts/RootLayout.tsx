import { Outlet, useLocation } from "react-router-dom";
import { FloatingChatbot } from "@/components/FloatingChatbot";
import { BackToTopButton, ScrollProgressBar } from "@/components/motion/ScrollReveal";
import { SmoothScrollProvider } from "@/providers/SmoothScrollProvider";

const HIDE_SCROLL_CHROME_PATHS = [
  "/admin",
  "/staff",
  "/login",
  "/register",
  "/forgot-password",
];

export default function RootLayout() {
  const location = useLocation();

  const shouldHideScrollChrome = HIDE_SCROLL_CHROME_PATHS.some((path) =>
    location.pathname.startsWith(path)
  );
  const shouldHideBackToTop =
    shouldHideScrollChrome || location.pathname.startsWith("/ai-chat");
  const shouldHideChatbot = shouldHideBackToTop;

  return (
    <SmoothScrollProvider>
      {!shouldHideScrollChrome && <ScrollProgressBar />}
      <Outlet />
      {!shouldHideBackToTop && <BackToTopButton />}
      {!shouldHideChatbot && <FloatingChatbot />}
    </SmoothScrollProvider>
  );
}
