import { useEffect, useState } from "react";
import { OrderHistoryCard } from "@/components/orders/OrderHistoryCard";
import { TablePagination } from "@/components/shared/TablePagination";
import { orderApi } from "@/services/ecommerceServices";
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
        <p className="mt-2 text-sm text-[#6B7280]">Theo dõi trạng thái, xem sản phẩm và đánh giá sau khi nhận hàng.</p>

        <div className="mt-6 space-y-3">
          {orders.map((order) => (
            <OrderHistoryCard key={order.orderId} order={order} />
          ))}
          {orders.length === 0 && (
            <p className="rounded-2xl border border-dashed border-[#E5E7EB] bg-white p-8 text-center text-[#6B7280]">
              Bạn chưa có đơn hàng nào.
            </p>
          )}
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
