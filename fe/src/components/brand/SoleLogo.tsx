import { cn } from "@/lib/utils";

type SoleLogoProps = {
  variant?: "full" | "icon";
  size?: "sm" | "md" | "lg" | "xl";
  inverted?: boolean;
  className?: string;
};

const sizeMap = {
  sm: { icon: 32, text: "text-lg" },
  md: { icon: 40, text: "text-xl" },
  lg: { icon: 56, text: "text-3xl" },
  xl: { icon: 72, text: "text-4xl" },
};

export function SoleLogo({
  variant = "full",
  size = "md",
  inverted = false,
  className,
}: SoleLogoProps) {
  const { icon: iconSize, text: textSize } = sizeMap[size];
  const wordColor = inverted ? "text-white" : "text-[#111111]";
  const dotColor = "text-[#E53935]";

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="48" height="48" rx="14" fill={inverted ? "#FFFFFF" : "#111111"} />
        <path
          d="M12 30C12 30 14 22 24 22C34 22 36 30 36 30"
          stroke={inverted ? "#111111" : "#FFFFFF"}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M14 34H34"
          stroke="#E53935"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M16 26C18 24 21 23 24 23C27 23 30 24 32 26"
          stroke={inverted ? "#111111" : "#FFFFFF"}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.85"
        />
        <circle cx="24" cy="17" r="3" fill="#E53935" />
      </svg>

      {variant === "full" ? (
        <span className={cn("font-black tracking-tight leading-none", textSize, wordColor)}>
          SOLE<span className={dotColor}>.</span>
        </span>
      ) : null}
    </div>
  );
}
