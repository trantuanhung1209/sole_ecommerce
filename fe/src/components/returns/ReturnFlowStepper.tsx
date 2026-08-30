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
    <div className={cn("space-y-4", className)}>
      <ol className="space-y-0">
        {RETURN_FLOW_STEPS.map((step, index) => {
          const done = !rejected && activeIndex > index;
          const current = !rejected && activeIndex === index;
          const upcoming = !rejected && activeIndex < index;
          const isLast = index === RETURN_FLOW_STEPS.length - 1;
          const hint = variant === "customer" ? step.customerHint : step.staffHint;

          return (
            <li key={step.status} className="flex gap-3">
              <div className="flex flex-col items-center self-stretch">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                    done && "border-green-600 bg-green-600 text-white",
                    current && "border-primary bg-primary text-primary-foreground",
                    upcoming && "border-muted-foreground/30 text-muted-foreground",
                    rejected && "border-muted-foreground/30 text-muted-foreground opacity-50"
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                {!isLast ? (
                  <div
                    className={cn(
                      "my-1 w-0.5 min-h-5 flex-1",
                      done ? "bg-green-600" : "bg-border",
                      rejected && "opacity-50"
                    )}
                  />
                ) : null}
              </div>
              <div className={cn("min-w-0 flex-1", !isLast && "pb-4")}>
                <p
                  className={cn(
                    "text-sm font-semibold leading-snug",
                    current && "text-foreground",
                    done && "text-foreground",
                    (upcoming || rejected) && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
                {current ? (
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{hint}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
      {terminal && status === "REJECTED" ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm leading-relaxed text-destructive">
          Yêu cầu đã bị từ chối — đơn hàng được khôi phục trạng thái trước khi trả.
        </p>
      ) : null}
      {terminal && status === "REFUNDED" ? (
        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm leading-relaxed text-green-800">
          Quy trình trả hàng và hoàn tiền đã hoàn tất.
        </p>
      ) : null}
    </div>
  );
}
