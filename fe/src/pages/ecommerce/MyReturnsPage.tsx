import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { returnApi } from "@/services/ecommerceServices";
import type { ReturnRequest } from "@/types/ecommerce.type";

export default function MyReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);

  useEffect(() => {
    returnApi.mine().then(setReturns).catch(console.error);
  }, []);

  return (
    <main className="mx-auto max-w-[900px] px-4 py-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Yêu cầu trả hàng</h1>
        <Link to="/orders" className="text-sm underline">Đơn hàng của tôi</Link>
      </div>
      {returns.length === 0 ? (
        <p className="text-[#6B7280]">Bạn chưa có yêu cầu trả hàng nào.</p>
      ) : (
        returns.map((item) => (
          <div key={item.returnId} className="rounded-xl border border-[#E5E7EB] bg-white p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">Đơn {item.orderId}</p>
              <p className="text-sm text-[#6B7280]">{item.reason}</p>
              <p className="text-xs text-[#9CA3AF]">{new Date(item.createdAt).toLocaleString("vi-VN")}</p>
            </div>
            <StatusBadge kind="return" status={item.status} />
          </div>
        ))
      )}
    </main>
  );
}
