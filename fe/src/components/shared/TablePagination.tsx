import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PaginationItem = number | "ellipsis";

type TablePaginationProps = {
  page: number;
  totalPages: number;
  totalElements?: number;
  onPageChange: (page: number) => void;
  className?: string;
};

/** Clamps a 0-based page index into valid bounds [0, totalPages - 1]. */
// eslint-disable-next-line react-refresh/only-export-components
export function clampPage(page: number, totalPages: number): number {
  if (totalPages <= 0 || !Number.isFinite(page)) {
    return 0;
  }
  return Math.max(0, Math.min(Math.trunc(page), totalPages - 1));
}

/** Slices an array for a 0-based page and clamps the page index when items shrink. */
// eslint-disable-next-line react-refresh/only-export-components
export function paginateItems<T>(
  items: readonly T[],
  page: number,
  pageSize: number
): { items: T[]; page: number; totalPages: number; totalElements: number } {
  const safeSize = Math.max(1, Math.trunc(pageSize) || 1);
  const totalElements = items.length;
  const totalPages = Math.ceil(totalElements / safeSize);
  const safePage = clampPage(page, totalPages);
  const start = safePage * safeSize;
  return {
    items: items.slice(start, start + safeSize),
    page: safePage,
    totalPages,
    totalElements,
  };
}

/** Builds 0-based page numbers with compact ellipsis for large page counts. */
// eslint-disable-next-line react-refresh/only-export-components
export function getPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 0) return [];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const safePage = clampPage(currentPage, totalPages);
  let left = Math.max(1, safePage - 1);
  let right = Math.min(totalPages - 2, safePage + 1);

  if (safePage <= 2) {
    left = 1;
    right = Math.min(totalPages - 2, 3);
  } else if (safePage >= totalPages - 3) {
    left = Math.max(1, totalPages - 4);
    right = totalPages - 2;
  }

  const items: PaginationItem[] = [0];
  if (left > 2) {
    items.push("ellipsis");
  } else if (left === 2) {
    items.push(1);
  }

  for (let i = left; i <= right; i += 1) {
    items.push(i);
  }

  if (right < totalPages - 3) {
    items.push("ellipsis");
  } else if (right === totalPages - 3) {
    items.push(totalPages - 2);
  }

  items.push(totalPages - 1);
  return items;
}

export function TablePagination({
  page,
  totalPages,
  totalElements,
  onPageChange,
  className,
}: TablePaginationProps) {
  if (totalPages <= 1) return null;

  const safePage = clampPage(page, totalPages);
  const items = getPaginationItems(safePage, totalPages);

  return (
    <nav
      aria-label="Phân trang"
      className={cn("flex flex-col items-center gap-3 pt-4 sm:flex-row sm:justify-between", className)}
    >
      <p className="text-sm text-muted-foreground">
        {totalElements !== undefined ? `Tổng ${totalElements} mục · ` : ""}
        Trang {safePage + 1} / {totalPages}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage === 0}
          aria-label="Trang trước"
          className="cursor-pointer rounded-lg border-[#E5E7EB] bg-white text-[#111111] hover:bg-[#F7F7F5] disabled:cursor-not-allowed"
        >
          Trước
        </Button>
        {items.map((item, index) => {
          if (item === "ellipsis") {
            return (
              <span
                key={`ellipsis-${index}`}
                aria-hidden="true"
                className="select-none px-1.5 text-sm text-[#6B7280]"
              >
                …
              </span>
            );
          }

          const isActive = item === safePage;
          return (
            <Button
              key={item}
              type="button"
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (!isActive) onPageChange(item);
              }}
              aria-label={`Trang ${item + 1}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "min-w-8 cursor-pointer rounded-lg px-2.5",
                isActive
                  ? "border-[#111111] bg-[#111111] text-white hover:bg-[#111111]/90"
                  : "border-[#E5E7EB] bg-white text-[#111111] hover:bg-[#F7F7F5]"
              )}
            >
              {item + 1}
            </Button>
          );
        })}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages - 1}
          aria-label="Trang sau"
          className="cursor-pointer rounded-lg border-[#E5E7EB] bg-white text-[#111111] hover:bg-[#F7F7F5] disabled:cursor-not-allowed"
        >
          Sau
        </Button>
      </div>
    </nav>
  );
}
