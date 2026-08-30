import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive relative overflow-hidden group cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary via-primary to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl hover:from-primary/90 hover:via-primary hover:to-primary/70 transform hover:scale-[1.02] active:scale-[0.98] before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:via-transparent before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700",
        destructive:
          "bg-gradient-to-r from-destructive via-destructive to-red-600 text-white shadow-lg hover:shadow-xl hover:from-destructive/90 hover:via-destructive hover:to-red-500 transform hover:scale-[1.02] active:scale-[0.98] before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:via-transparent before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border-2 border-primary/60 bg-transparent shadow-md text-primary font-semibold relative overflow-hidden hover:bg-primary hover:text-primary-foreground hover:border-primary hover:shadow-xl transform hover:scale-[1.03] active:scale-[0.98] transition-all duration-500 ease-out before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/20 before:via-primary/40 before:to-primary/20 before:translate-x-[-110%] before:skew-x-12 hover:before:translate-x-[100%] before:transition-transform before:duration-700 before:ease-out after:absolute after:inset-0 after:border-2 after:border-primary/30 after:rounded-md after:scale-110 after:opacity-0 hover:after:scale-100 hover:after:opacity-100 after:transition-all after:duration-300 dark:border-primary/50 dark:hover:bg-primary dark:hover:border-primary/80 dark:hover:shadow-[0_0_20px_rgba(var(--primary),0.3)]",
        ghost:
          "bg-transparent text-foreground shadow-none hover:bg-muted/80 hover:text-foreground transform hover:scale-[1.01] active:scale-[0.99] transition-all duration-200",
        link: "text-primary underline-offset-4 hover:underline transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 hover:text-primary/80",
      },
      size: {
        default: "h-10 px-6 py-2 has-[>svg]:px-5 text-base",
        sm: "h-8 rounded-md gap-1.5 px-4 has-[>svg]:px-3 text-sm",
        lg: "h-12 rounded-lg px-8 has-[>svg]:px-6 text-lg font-semibold",
        xl: "h-14 rounded-xl px-10 has-[>svg]:px-8 text-xl font-bold",
        icon: "size-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };
