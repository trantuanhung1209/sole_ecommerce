import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { TablePagination } from "@/components/shared/TablePagination";
import { money, orderApi } from "@/services/ecommerceServices";
import type { Order } from "@/types/ecommerce.type";

const PAGE_SIZE = 10;

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    orderApi.mine(page, PAGE_SIZE).then((result) => {
      setOrders(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    });
  }, [page]);

  return (
    <main className="min-h-screen bg-[#F7F7F5] px-4 py-8 text-[#111111]">
      <section className="mx-auto max-w-[1240px]">
        <h1 className="text-4xl font-bold">Đơn hàng của tôi</h1>
        <div className="mt-6 space-y-3">
          {orders.map((order) => (
            <Card key={order.orderId} className="rounded-2xl bg-white">
              <CardContent className="flex items-center justify-between p-5">
                <Link to={`/orders/${order.orderId}`} className="flex items-center gap-4 flex-1">
                  <div className="rounded-full bg-[#F1F1EF] p-3"><Package className="h-5 w-5" /></div>
                  <div>
                    <p className="font-bold">{order.orderCode}</p>
                    <p className="text-sm text-[#6B7280]">{money(order.grandTotal)}</p>
                  </div>
                </Link>
                <StatusBadge kind="order" status={order.status} />
              </CardContent>
            </Card>
          ))}
          {orders.length === 0 && <p className="text-[#6B7280]">Bạn chưa có đơn hàng nào.</p>}
        </div>
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          onPageChange={setPage}
        />
      </section>
    </main>
  );
}
