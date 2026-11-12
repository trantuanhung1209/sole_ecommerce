import { useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { SoleLogo } from "@/components/brand/SoleLogo";
import { cn } from "@/lib/utils";

const CRISP_EASE = [0.22, 1, 0.36, 1] as const;

export const ROUTE_TRANSITION_DURATION_MS = 380;

const HIDE_INITIAL_TRANSITION_BAR_PATHS = [
  "/admin",
  "/staff",
  "/login",
  "/register",
  "/forgot-password",
];

export type SolePageLoaderProps = {
  label?: string;
  fullScreen?: boolean;
  compact?: boolean;
  className?: string;
};

export function SolePageLoader({
  label = "Đang tải...",
  fullScreen = false,
  compact = false,
  className,
}: SolePageLoaderProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid="sole-page-loader"
      data-variant={fullScreen ? "fullscreen" : compact ? "compact" : "section"}
      className={cn(
        "flex w-full items-center justify-center text-[#111111]",
        fullScreen
          ? "min-h-screen bg-[#F7F7F5] px-4 py-12"
          : compact
            ? "py-6"
            : "min-h-[60vh] bg-[#F7F7F5] px-4 py-10",
        className
      )}
    >
      <div
        className={cn(
          "rounded-2xl border border-[#E5E7EB] bg-white/90 shadow-sm backdrop-blur-sm",
          compact
            ? "flex items-center gap-4 px-5 py-3.5"
            : "flex w-full max-w-sm flex-col items-center gap-4 px-8 py-7 text-center"
        )}
      >
        <SoleLogo size={compact ? "sm" : "md"} />

        <div
          className={cn(
            "flex flex-col",
            compact ? "min-w-[160px] gap-2" : "w-full items-center gap-3"
          )}
        >
          <div
            aria-hidden="true"
            className={cn(
              "relative h-1.5 overflow-hidden rounded-full bg-[#F1F1EF]",
              compact ? "w-36" : "w-44"
            )}
          >
            <motion.div
              className="h-full w-full origin-left rounded-full bg-[#E53935]"
              initial={
                shouldReduceMotion
                  ? false
                  : { scaleX: 0.18, opacity: 0.7 }
              }
              animate={
                shouldReduceMotion
                  ? { scaleX: 0.65, opacity: 0.9 }
                  : {
                      scaleX: [0.18, 0.88, 0.24],
                      opacity: [0.7, 1, 0.7],
                    }
              }
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : {
                      duration: 1.2,
                      repeat: Infinity,
                      ease: CRISP_EASE,
                    }
              }
            />
          </div>

          <p className="text-sm font-semibold tracking-tight text-[#111111]">
            {label}
          </p>

          {!compact ? (
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6B7280]">
              SOLE · Authentic Footwear
            </p>
          ) : null}

          {label !== "Đang tải..." ? (
            <span className="sr-only">Đang tải...</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export type RouteTransitionBarProps = {
  className?: string;
  active?: boolean;
};

export function RouteTransitionBar({
  className,
  active,
}: RouteTransitionBarProps) {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const [initialPathname] = useState(() => location.pathname);

  const isSuppressedInitialChrome = HIDE_INITIAL_TRANSITION_BAR_PATHS.some(
    (path) => location.pathname.startsWith(path)
  );
  const hasNavigated = location.pathname !== initialPathname;
  const shouldRender = active ?? (hasNavigated || !isSuppressedInitialChrome);

  if (!shouldRender) {
    return null;
  }

  return (
    <motion.div
      key={location.pathname}
      aria-hidden="true"
      data-testid="route-transition-bar"
      data-pathname={location.pathname}
      initial={
        shouldReduceMotion
          ? false
          : { scaleX: 0.08, opacity: 0.95 }
      }
      animate={{ scaleX: 1, opacity: 0 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : {
              duration: ROUTE_TRANSITION_DURATION_MS / 1000,
              ease: CRISP_EASE,
            }
      }
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-[#E53935]",
        className
      )}
    />
  );
}

export default SolePageLoader;
