import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarRatingProps = {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
};

const sizeClass = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function StarRating({ rating, max = 5, size = "md", showValue, className }: StarRatingProps) {
  const normalized = Math.max(0, Math.min(max, rating));

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: max }).map((_, index) => {
        const filled = normalized >= index + 1;
        const partial = !filled && normalized > index;
        return (
          <Star
            key={index}
            className={cn(
              sizeClass[size],
              filled || partial ? "fill-[#E53935] text-[#E53935]" : "fill-transparent text-[#D1D5DB]"
            )}
          />
        );
      })}
      {showValue ? <span className="ml-1.5 text-sm font-semibold">{normalized.toFixed(1)}</span> : null}
    </div>
  );
}
