import { Check } from "lucide-react";
import { RETURN_FLOW_STEPS, getReturnStepIndex, isReturnTerminal } from "@/utils/returnFlow";
import { cn } from "@/lib/utils";

type ReturnFlowStepperProps = {
  status: string;
  variant?: "customer" | "staff";
  className?: string;
};

export function ReturnFlowStepper({ status, variant = "customer", className }: ReturnFlowStepperProps) {
  const terminal = isReturnTerminal(status);
  const rejected = status === "REJECTED" || status === "CLOSED";
  const activeIndex = getReturnStepIndex(status);

  return (
    <div className={cn("space-y-3", className)}>
      <ol className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-0">
        {RETURN_FLOW_STEPS.map((step, index) => {
          const done = !rejected && activeIndex > index;
          const current = !rejected && activeIndex === index;
          const upcoming = !rejected && activeIndex < index;

          return (
            <li key={step.status} className="flex min-w-0 items-center gap-2 sm:flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                    done && "border-green-600 bg-green-600 text-white",
                    current && "border-primary bg-primary text-primary-foreground",
                    upcoming && "border-muted-foreground/30 text-muted-foreground",
                    rejected && "border-muted-foreground/30 text-muted-foreground opacity-50"
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span
                  className={cn(
                    "truncate text-xs font-medium sm:text-sm",
                    current && "text-foreground",
                    (upcoming || rejected) && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < RETURN_FLOW_STEPS.length - 1 ? (
                <div
                  className={cn(
                    "hidden h-px flex-1 bg-border sm:mx-2 sm:block",
                    done && "bg-green-600"
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
      {terminal && status === "REJECTED" ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          Yêu cầu đã bị từ chối — đơn hàng được khôi phục trạng thái trước khi trả.
        </p>
      ) : null}
      {!terminal ? (
        <p className="text-sm text-muted-foreground">
          {variant === "customer"
            ? RETURN_FLOW_STEPS[activeIndex]?.customerHint
            : RETURN_FLOW_STEPS[activeIndex]?.staffHint}
        </p>
      ) : null}
    </div>
  );
}
