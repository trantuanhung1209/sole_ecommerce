import { useEffect, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  type Variants,
} from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useSmoothScroll } from "@/providers/SmoothScrollProvider";
import { cn } from "@/lib/utils";

const CRISP_EASE = [0.22, 1, 0.36, 1] as const;

export type RevealDirection = "up" | "down" | "left" | "right" | "none";

export type ScrollViewportOptions = {
  once?: boolean;
  amount?: "some" | "all" | number;
};

const DEFAULT_VIEWPORT: ScrollViewportOptions = {
  once: true,
  amount: 0.12,
};

function getDirectionOffset(direction: RevealDirection, distance: number) {
  switch (direction) {
    case "up":
      return { x: 0, y: distance };
    case "down":
      return { x: 0, y: -distance };
    case "left":
      return { x: distance, y: 0 };
    case "right":
      return { x: -distance, y: 0 };
    case "none":
    default:
      return { x: 0, y: 0 };
  }
}

export type ScrollRevealProps = {
  children: ReactNode;
  direction?: RevealDirection;
  distance?: number;
  delay?: number;
  duration?: number;
  className?: string;
  viewport?: ScrollViewportOptions;
};

export function ScrollReveal({
  children,
  direction = "up",
  distance = 20,
  delay = 0,
  duration = 0.45,
  className,
  viewport = DEFAULT_VIEWPORT,
}: ScrollRevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const offset = shouldReduceMotion ? { x: 0, y: 0 } : getDirectionOffset(direction, distance);

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, x: offset.x, y: offset.y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={viewport}
      transition={{
        duration: shouldReduceMotion ? 0 : duration,
        delay: shouldReduceMotion ? 0 : delay,
        ease: CRISP_EASE,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export type ScrollStaggerProps = {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  delayChildren?: number;
  viewport?: ScrollViewportOptions;
};

export function ScrollStagger({
  children,
  className,
  staggerDelay = 0.05,
  delayChildren = 0.04,
  viewport = DEFAULT_VIEWPORT,
}: ScrollStaggerProps) {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : staggerDelay,
        delayChildren: shouldReduceMotion ? 0 : delayChildren,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial={shouldReduceMotion ? false : "hidden"}
      whileInView="visible"
      viewport={viewport}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export type ScrollStaggerItemProps = {
  children: ReactNode;
  className?: string;
  direction?: RevealDirection;
  distance?: number;
  duration?: number;
};

export function ScrollStaggerItem({
  children,
  className,
  direction = "up",
  distance = 16,
  duration = 0.4,
}: ScrollStaggerItemProps) {
  const shouldReduceMotion = useReducedMotion();
  const offset = shouldReduceMotion ? { x: 0, y: 0 } : getDirectionOffset(direction, distance);

  const itemVariants: Variants = {
    hidden: shouldReduceMotion
      ? { opacity: 1, x: 0, y: 0 }
      : { opacity: 0, x: offset.x, y: offset.y },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : duration,
        ease: CRISP_EASE,
      },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

export function ScrollProgressBar({ className }: { className?: string }) {
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 280,
    damping: 32,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-[#E53935]",
        className
      )}
      style={{ scaleX: shouldReduceMotion ? scrollYProgress : smoothProgress }}
    />
  );
}

export type BackToTopButtonProps = {
  threshold?: number;
  className?: string;
};

function isPastScrollThreshold(threshold: number): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const currentY =
    window.scrollY ??
    (typeof document !== "undefined" ? document.documentElement.scrollTop : 0) ??
    0;
  return currentY > threshold;
}

export function BackToTopButton({ threshold = 320, className }: BackToTopButtonProps) {
  const { scrollToTop } = useSmoothScroll();
  const shouldReduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(() => isPastScrollThreshold(threshold));

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateVisibility = () => {
      setVisible(isPastScrollThreshold(threshold));
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, [threshold]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          key="back-to-top"
          type="button"
          aria-label="Lên đầu trang"
          title="Lên đầu trang"
          onClick={() => scrollToTop()}
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.92 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: CRISP_EASE }}
          className={cn(
            "fixed bottom-6 left-6 z-40 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-[#111111] text-white shadow-lg transition-colors hover:bg-[#E53935] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E53935] focus-visible:ring-offset-2",
            className
          )}
        >
          <ArrowUp className="h-5 w-5" aria-hidden="true" />
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
