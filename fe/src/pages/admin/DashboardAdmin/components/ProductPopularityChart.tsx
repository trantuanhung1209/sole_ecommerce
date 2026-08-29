import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface ProductPopularityData {
  productName: string;
  orders: number;
  revenue: number;
}

interface ProductPopularityChartProps {
  data: ProductPopularityData[];
  formatCurrency: (amount: number) => string;
}

export function ProductPopularityChart({ data, formatCurrency }: ProductPopularityChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Sản phẩm bán chạy
        </CardTitle>
        <CardDescription>Top sản phẩm theo số lượng bán</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="productName" type="category" width={120} />
            <Tooltip
              formatter={(value: number, name: string) =>
                name === "revenue" ? [formatCurrency(value), "Doanh thu"] : [value, "Số lượng"]
              }
            />
            <Legend formatter={(value) => (value === "revenue" ? "Doanh thu" : "Số lượng")} />
            <Bar dataKey="orders" fill="#3b82f6" name="orders" />
            <Bar dataKey="revenue" fill="#22c55e" name="revenue" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
