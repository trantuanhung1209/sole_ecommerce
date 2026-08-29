import { motion } from "framer-motion";
import React from "react";
import { FloatingParticles } from "./FloatingParticles";

// Internal component that will be memoized
const AnimatedBackgroundComponent = () => {
  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Hiệu ứng nền động nhiều lớp */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            "radial-gradient(circle at 20% 30%, oklch(0.95 0.08 220) 0%, transparent 50%), radial-gradient(circle at 80% 70%, oklch(0.92 0.12 225) 0%, transparent 50%), linear-gradient(135deg, oklch(0.98 0.02 220), oklch(0.96 0.04 210), oklch(0.94 0.06 230))",
            "radial-gradient(circle at 60% 20%, oklch(0.93 0.10 225) 0%, transparent 50%), radial-gradient(circle at 30% 80%, oklch(0.96 0.06 215) 0%, transparent 50%), linear-gradient(135deg, oklch(0.97 0.03 215), oklch(0.95 0.05 225), oklch(0.93 0.08 220))",
            "radial-gradient(circle at 90% 10%, oklch(0.94 0.09 230) 0%, transparent 50%), radial-gradient(circle at 10% 90%, oklch(0.95 0.07 220) 0%, transparent 50%), linear-gradient(135deg, oklch(0.96 0.04 230), oklch(0.94 0.06 210), oklch(0.92 0.10 225))",
            "radial-gradient(circle at 40% 60%, oklch(0.96 0.06 215) 0%, transparent 50%), radial-gradient(circle at 70% 40%, oklch(0.93 0.11 225) 0%, transparent 50%), linear-gradient(135deg, oklch(0.98 0.02 220), oklch(0.96 0.04 210), oklch(0.94 0.06 230))",
          ],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Hiệu ứng hạt bụi bay */}
      <FloatingParticles />

      {/* Hiệu ứng lan tỏa vòng tròn */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`ripple-${i}`}
          className="absolute rounded-full border-2"
          style={{
            width: 100,
            height: 100,
            left: `${20 + i * 30}%`,
            top: `${20 + i * 25}%`,
            borderColor: `oklch(0.68 0.10 237 / 0.3)`,
            borderStyle: "solid",
          }}
          animate={{
            scale: [1, 4, 1],
            opacity: [0, 0.6, 0.3, 0],
            borderWidth: [2, 1, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 2.5,
            times: [0, 0.3, 0.7, 1],
          }}
        />
      ))}

      {/* Hiệu ứng vòng tròn nhỏ dịu nhẹ */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`small-ripple-${i}`}
          className="absolute rounded-full border"
          style={{
            width: 60,
            height: 60,
            left: `${60 + (i % 2) * 20}%`,
            top: `${40 + (i % 2) * 30}%`,
            borderColor: `oklch(0.72 0.08 245 / 0.2)`,
            borderStyle: "solid",
            borderWidth: 1,
          }}
          animate={{
            scale: [1, 2.5, 1],
            opacity: [0, 0.4, 0.2, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 3,
          }}
        />
      ))}
    </div>
  );
};

// Wrap component with React.memo to prevent unnecessary re-renders
export const AnimatedBackground = React.memo(AnimatedBackgroundComponent);
