import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminFilterBar } from "@/components/shared/AdminFilterBar";
import { TablePagination } from "@/components/shared/TablePagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useSmoothScroll } from "@/providers/SmoothScrollProvider";
import { promotionApi, type Coupon } from "@/services/ecommerceServices";
import { ADMIN_PAGE_SIZE, clampPage, paginateSlice, scrollPortalToTop } from "../utils/pagination";

const PAGE_SIZE = ADMIN_PAGE_SIZE;

type PromotionStatusFilter = "ALL" | "ACTIVE" | "INACTIVE" | "EXPIRED";

const PROMOTION_STATUS_OPTIONS = [
  { value: "ALL", label: "Tất cả" },
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "INACTIVE", label: "Tạm ngưng" },
  { value: "EXPIRED", label: "Đã hết hạn" },
];

function getCouponStatus(coupon: Coupon): Exclude<PromotionStatusFilter, "ALL"> {
  if (coupon.endsAt && new Date(coupon.endsAt).getTime() < Date.now()) {
    return "EXPIRED";
  }
  return coupon.active === false ? "INACTIVE" : "ACTIVE";
}

interface PromotionManagementPageProps {
  initialCoupons?: Coupon[];
  initialPage?: number;
}

export default function PromotionManagementPage({
  initialCoupons,
  initialPage = 0,
}: PromotionManagementPageProps = {}) {
  const { role, canManagePromotions } = useRoleAccess();
  const { scrollToTop } = useSmoothScroll();
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons ?? []);
  const [loading, setLoading] = useState(!initialCoupons);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PromotionStatusFilter>("ALL");
  const [page, setPage] = useState(initialPage);
  const [form, setForm] = useState({ code: "", type: "PERCENTAGE" as Coupon["type"], value: "10" });
  const debouncedSearch = useDebounce(search, 300);

  const canManage = canManagePromotions(role);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCoupons(await promotionApi.listCoupons());
    } catch {
      toast.error("Không tải được coupon");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, statusFilter]);

  const create = async () => {
    if (!form.code.trim()) return;
    try {
      await promotionApi.createCoupon({
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value),
        active: true,
      });
      toast.success("Đã tạo mã giảm giá");
      setForm({ code: "", type: "PERCENTAGE", value: "10" });
      await load();
    } catch {
      toast.error("Không thể tạo coupon");
    }
  };

  const filteredCoupons = useMemo(
    () =>
      coupons.filter((coupon) => {
        if (statusFilter !== "ALL" && getCouponStatus(coupon) !== statusFilter) {
          return false;
        }
        if (!debouncedSearch) return true;
        const keyword = debouncedSearch.toLowerCase();
        return (
          coupon.code.toLowerCase().includes(keyword) ||
          coupon.type.toLowerCase().includes(keyword)
        );
      }),
    [coupons, debouncedSearch, statusFilter]
  );

  const {
    content: paginatedCoupons,
    page: safePage,
    totalPages,
    totalElements,
  } = useMemo(() => paginateSlice(filteredCoupons, page, PAGE_SIZE), [filteredCoupons, page]);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  const handlePageChange = (nextPage: number) => {
    setPage(clampPage(nextPage, totalPages));
    scrollPortalToTop(scrollToTop);
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setPage(0);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Mã giảm giá</h1>

      <AdminFilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Tìm theo mã coupon hoặc loại...",
        }}
        selects={[
          {
            id: "promotion-status",
            label: "Trạng thái",
            value: statusFilter,
            onChange: (value) => setStatusFilter(value as PromotionStatusFilter),
            options: PROMOTION_STATUS_OPTIONS,
          },
        ]}
        onReset={resetFilters}
        onRefresh={load}
        refreshing={loading}
        resultText={`Hiển thị ${paginatedCoupons.length}/${totalElements} mã giảm giá`}
      />

      {canManage && (
        <div className="grid gap-2 max-w-md">
          <Input
            placeholder="Mã (VD: SOLE10)"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
          <select
            className="border rounded px-3 py-2 bg-background"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as Coupon["type"] })}
          >
            <option value="PERCENTAGE">Phần trăm</option>
            <option value="FIXED_AMOUNT">Số tiền cố định</option>
            <option value="FREE_SHIPPING">Miễn phí ship</option>
          </select>
          <Input
            type="number"
            placeholder="Giá trị"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
          />
          <Button onClick={create}>Tạo coupon</Button>
        </div>
      )}

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <>
          <div className="space-y-2">
            {paginatedCoupons.length === 0 ? (
              <p className="rounded-lg border p-6 text-center text-muted-foreground">
                Không có mã giảm giá phù hợp bộ lọc.
              </p>
            ) : (
              paginatedCoupons.map((c) => {
                const status = getCouponStatus(c);
                return (
                  <div key={c.couponId} className="rounded border p-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{c.code}</span>
                      <Badge variant={status === "ACTIVE" ? "success" : "secondary"}>
                        {status === "ACTIVE"
                          ? "Hoạt động"
                          : status === "EXPIRED"
                            ? "Hết hạn"
                            : "Tạm ngưng"}
                      </Badge>
                    </div>
                    <span className="text-muted-foreground">
                      {c.type} · {c.value} · đã dùng {c.usedCount ?? 0}
                      {c.usageLimit ? `/${c.usageLimit}` : ""}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <TablePagination
            page={safePage}
            totalPages={totalPages}
            totalElements={totalElements}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
