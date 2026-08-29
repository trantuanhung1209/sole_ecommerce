import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface BackToHomeButtonProps {
  className?: string;
}

export const BackToHomeButton = ({ className = "" }: BackToHomeButtonProps) => {
  return (
    <Link to="/" className={`fixed top-6 left-6 z-20 group ${className}`}>
      <div className="relative">
        {/* Multi-layer Glow Effect */}
        <div className="absolute -inset-3 bg-gradient-to-r from-primary/25 via-accent/20 to-primary/25 rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition-all duration-600 animate-pulse" />
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/15 to-accent/15 rounded-xl blur-lg opacity-40 group-hover:opacity-100 transition-opacity duration-400" />

        {/* Main Button Container */}
        <div className="relative bg-gradient-to-br from-white via-white/95 to-gray-50/90 backdrop-blur-xl border border-white/50 hover:border-primary/40 shadow-xl hover:shadow-2xl rounded-xl transition-all duration-400 group-hover:scale-105 group-active:scale-100">
          {/* Inner gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

          {/* Button Content */}
          <div className="relative flex items-center gap-3 px-4 py-3">
            {/* Enhanced Icon Container */}
            <div className="relative">
              {/* Icon background with animated gradient */}
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-primary/15 via-primary/10 to-accent/15 group-hover:from-primary/25 group-hover:via-primary/20 group-hover:to-accent/25 transition-all duration-400 shadow-md group-hover:shadow-lg">
                {/* Inner shine effect */}
                <div className="absolute inset-1 bg-gradient-to-br from-white/20 to-transparent rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <ArrowLeft className="relative h-5 w-5 text-primary transition-all duration-400 group-hover:-translate-x-0.5 group-hover:text-primary/90 group-hover:scale-105" />
              </div>

              {/* Floating accent dot */}
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-gradient-to-br from-accent to-primary rounded-full opacity-0 group-hover:opacity-100 transition-all duration-400 group-hover:animate-bounce" />
            </div>

            {/* Enhanced Text */}
            <div className="hidden sm:flex flex-col">
              <span className="font-semibold text-base text-foreground group-hover:text-primary transition-all duration-300 group-hover:tracking-wide">
                Quay về trang chủ
              </span>
              <span className="text-xs text-muted-foreground/70 group-hover:text-primary/60 transition-colors duration-300">
                Nhấn để trở về
              </span>
            </div>

            {/* Mobile text */}
            <span className="sm:hidden font-semibold text-base text-foreground group-hover:text-primary transition-all duration-300">
              Home
            </span>

            {/* Decorative Elements */}
            <div className="hidden lg:flex items-center gap-1 ml-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/30 group-hover:bg-primary transition-all duration-300 group-hover:scale-110" />
              <div className="w-1 h-1 rounded-full bg-accent/40 group-hover:bg-accent transition-all duration-400 delay-75 group-hover:scale-110" />
            </div>
          </div>

          {/* Bottom highlight */}
          <div className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
        </div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1 left-1 w-0.5 h-0.5 bg-primary/40 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-800 group-hover:animate-ping" />
          <div className="absolute bottom-1 right-1 w-0.5 h-0.5 bg-accent/40 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-800 delay-200 group-hover:animate-ping" />
        </div>
      </div>
    </Link>
  );
};
