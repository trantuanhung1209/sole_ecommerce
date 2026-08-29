import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/30 dark:bg-primary/15 dark:border-primary/25 dark:hover:bg-primary/25",
        secondary:
          "border-primary/15 bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:border-primary/25 dark:bg-secondary/50 dark:hover:bg-secondary/70",
        destructive:
          "border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:border-destructive/30 dark:bg-destructive/15 dark:border-destructive/25 dark:hover:bg-destructive/25",
        outline:
          "border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground hover:border-primary/30 dark:hover:border-primary/40",
        success:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 hover:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25 dark:hover:bg-emerald-500/25",
        warning:
          "border-amber-500/20 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 hover:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25 dark:hover:bg-amber-500/25",
        info: "border-sky-500/20 bg-sky-500/10 text-sky-700 hover:bg-sky-500/20 hover:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/25 dark:hover:bg-sky-500/25",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

/* eslint-disable react-refresh/only-export-components */
export { Badge, badgeVariants };
