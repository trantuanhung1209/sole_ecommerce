import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { TrendingUp } from "lucide-react";

interface GrowthStatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  growth: number;
  bgColor?: string;
  iconColor?: string;
}

export function GrowthStatsCard({
  title,
  value,
  icon: Icon,
  growth,
  bgColor = "bg-primary/5",
  iconColor = "text-primary",
}: GrowthStatsCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 ${bgColor} rounded-full -mr-16 -mt-16`} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          <span
            className={`inline-flex items-center ${
              growth >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            {growth >= 0 ? "+" : ""}
            {growth.toFixed(1)}% so với kỳ trước
          </span>
        </p>
      </CardContent>
    </Card>
  );
}
