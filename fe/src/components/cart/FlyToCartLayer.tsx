import { motion } from "framer-motion";
import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useCart, type FlyToCartPayload } from "@/contexts/CartContext";

const FINAL_SIZE = 32;

function getCartIconRect(): DOMRect | null {
  const el = document.querySelector<HTMLElement>("[data-cart-icon-target]");
  if (!el) return null;

  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  return rect;
}

function buildArcKeyframes(from: DOMRect, to: DOMRect) {
  const startLeft = from.left + from.width / 2 - 46;
  const startTop = from.top + from.height / 2 - 46;
  const endLeft = to.left + to.width / 2 - FINAL_SIZE / 2;
  const endTop = to.top + to.height / 2 - FINAL_SIZE / 2;
  const midLeft = startLeft + (endLeft - startLeft) * 0.48;
  const midTop = Math.min(startTop, endTop) - Math.max(80, Math.abs(endTop - startTop) * 0.4);

  return { startLeft, startTop, midLeft, midTop, endLeft, endTop };
}

function FlyItem({ item, onComplete }: { item: FlyToCartPayload; onComplete: () => void }) {
  const [target, setTarget] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    const resolveTarget = () => {
      const rect = getCartIconRect();
      if (rect) setTarget(rect);
    };

    resolveTarget();
    window.addEventListener("scroll", resolveTarget, true);
    window.addEventListener("resize", resolveTarget);

    return () => {
      window.removeEventListener("scroll", resolveTarget, true);
      window.removeEventListener("resize", resolveTarget);
    };
  }, []);

  if (!target) return null;

  const { startLeft, startTop, midLeft, midTop, endLeft, endTop } = buildArcKeyframes(
    item.from,
    target
  );

  return (
    <motion.img
      src={item.imageUrl}
      alt=""
      className="fixed rounded-xl object-contain bg-white shadow-[0_16px_40px_rgba(0,0,0,0.18)] ring-2 ring-white/90"
      initial={{
        left: startLeft,
        top: startTop,
        width: 92,
        height: 92,
        opacity: 0.95,
        rotate: 0,
        filter: "blur(0px)",
      }}
      animate={{
        left: [startLeft, midLeft, endLeft],
        top: [startTop, midTop, endTop],
        width: [92, 78, FINAL_SIZE],
        height: [92, 78, FINAL_SIZE],
        opacity: [0.95, 1, 0.92, 0],
        rotate: [0, -10, 6, 0],
        filter: ["blur(0px)", "blur(0px)", "blur(0.5px)", "blur(1px)"],
      }}
      transition={{
        duration: 1.35,
        times: [0, 0.42, 0.82, 1],
        ease: [0.25, 0.82, 0.22, 1],
      }}
      onAnimationComplete={onComplete}
    />
  );
}

export function FlyToCartLayer() {
  const { flyItems, removeFlyItem } = useCart();

  if (typeof document === "undefined" || flyItems.length === 0) {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[120]">
      {flyItems.map((item) => (
        <FlyItem key={item.id} item={item} onComplete={() => removeFlyItem(item.id)} />
      ))}
    </div>,
    document.body
  );
}
