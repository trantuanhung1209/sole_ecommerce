import { RefreshCw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type FilterSelectOption = { value: string; label: string };

export type FilterSelectConfig = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterSelectOption[];
  className?: string;
};

type AdminFilterBarProps = {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  selects?: FilterSelectConfig[];
  onReset?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  resultText?: string;
  className?: string;
};

export function AdminFilterBar({
  search,
  selects = [],
  onReset,
  onRefresh,
  refreshing,
  resultText,
  className,
}: AdminFilterBarProps) {
  const hasActiveFilters =
    (search?.value?.trim() ?? "") !== "" ||
    selects.some((select) => select.value !== "ALL" && select.value !== "");

  return (
    <div className={cn("rounded-xl border bg-card p-4 shadow-sm md:p-5", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        {search ? (
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="admin-filter-search">Tìm kiếm</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="admin-filter-search"
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                placeholder={search.placeholder || "Tìm kiếm..."}
                className="pl-9"
              />
            </div>
          </div>
        ) : null}

        {selects.map((select) => (
          <div key={select.id} className={cn("space-y-1.5", select.className || "w-full lg:w-[200px]")}>
            <Label htmlFor={select.id}>{select.label}</Label>
            <Select value={select.value} onValueChange={select.onChange}>
              <SelectTrigger id={select.id}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {select.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        <div className="flex gap-2">
          {onReset && hasActiveFilters ? (
            <Button type="button" variant="outline" onClick={onReset}>
              <X className="mr-1 h-4 w-4" />
              Xóa lọc
            </Button>
          ) : null}
          {onRefresh ? (
            <Button type="button" variant="outline" size="icon" onClick={onRefresh} disabled={refreshing}>
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          ) : null}
        </div>
      </div>

      {resultText ? <p className="mt-3 text-sm text-muted-foreground">{resultText}</p> : null}
    </div>
  );
}
