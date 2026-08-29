import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TablePaginationProps = {
  page: number;
  totalPages: number;
  totalElements?: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function TablePagination({
  page,
  totalPages,
  totalElements,
  onPageChange,
  className,
}: TablePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={cn("flex flex-col items-center gap-3 pt-4 sm:flex-row sm:justify-between", className)}>
      <p className="text-sm text-muted-foreground">
        {totalElements !== undefined ? `Tổng ${totalElements} mục · ` : ""}
        Trang {page + 1} / {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
        >
          Trước
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
        >
          Sau
        </Button>
      </div>
    </div>
  );
}
