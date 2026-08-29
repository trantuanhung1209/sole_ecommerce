import { Activity, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TimeRange = "7days" | "30days" | "90days" | "year" | "all";

interface DashboardHeaderProps {
  timeRange: TimeRange;
  onTimeRangeChange: (value: TimeRange) => void;
  onExportExcel: () => void;
}

export function DashboardHeader({
  timeRange,
  onTimeRangeChange,
  onExportExcel,
}: DashboardHeaderProps) {
  return (
    <div className="bg-card border-b border-border">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="relative p-3 bg-primary/10 rounded-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Activity className="h-7 w-7 text-primary relative z-10" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground tracking-tight">
                Tổng quan
              </h1>
              <p className="text-muted-foreground mt-1.5">
                Thống kê và phân tích dữ liệu kinh doanh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={timeRange}
                onValueChange={(value) => onTimeRangeChange(value as TimeRange)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">7 ngày qua</SelectItem>
                  <SelectItem value="30days">30 ngày qua</SelectItem>
                  <SelectItem value="90days">90 ngày qua</SelectItem>
                  <SelectItem value="year">1 năm qua</SelectItem>
                  <SelectItem value="all">Toàn bộ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={onExportExcel} className="gap-2">
              <Download className="h-4 w-4" />
              Xuất Excel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
