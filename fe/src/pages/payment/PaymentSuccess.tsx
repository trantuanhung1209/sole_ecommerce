import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, Home, Receipt, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { orderApi, paymentApi } from "@/services/ecommerceServices";
import { useAppSelector } from "@/hooks/useRedux";

type VerifyState = "loading" | "confirmed" | "pending" | "failed" | "unauthenticated";

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isLoggedIn = useAppSelector((state) => state.auth.isLoggedIn);
  const [verifyState, setVerifyState] = useState<VerifyState>("loading");

  const orderId = searchParams.get("orderId");
  const orderCode = searchParams.get("orderCode");
  const transactionId =
    searchParams.get("transaction_id") || searchParams.get("transactionId");
  const orderInvoiceNumber =
    searchParams.get("order_invoice_number") || searchParams.get("orderInvoiceNumber");

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!orderId) {
        setVerifyState("pending");
        return;
      }
      if (!isLoggedIn) {
        setVerifyState("unauthenticated");
        return;
      }

      const maxAttempts = 8;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const [order, payment] = await Promise.all([
            orderApi.detail(orderId),
            paymentApi.byOrder(orderId).catch(() => null),
          ]);
          if (cancelled) return;

          const paid =
            order.paymentStatus === "COMPLETED" ||
            order.status === "PAID" ||
            payment?.status === "COMPLETED";
          if (paid) {
            setVerifyState("confirmed");
            return;
          }
          const failed =
            payment?.status === "FAILED" ||
            payment?.status === "EXPIRED" ||
            order.status === "CANCELLED";
          if (failed) {
            setVerifyState("failed");
            return;
          }
        } catch {
          if (cancelled) return;
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
      if (!cancelled) setVerifyState("pending");
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [orderId, isLoggedIn]);

  const loading = verifyState === "loading";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/20">
        <CardHeader className="text-center pb-4">
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
              <CardTitle className="text-2xl">Đang xác nhận thanh toán...</CardTitle>
              <CardDescription>Đang đồng bộ với hệ thống, vui lòng chờ</CardDescription>
            </div>
          ) : verifyState === "confirmed" ? (
            <>
              <div className="mx-auto mb-4">
                <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
              </div>
              <CardTitle className="text-3xl font-bold">Thanh toán thành công!</CardTitle>
              <CardDescription className="text-base mt-2">
                Giao dịch đã được xác nhận trên hệ thống
              </CardDescription>
            </>
          ) : verifyState === "failed" ? (
            <>
              <div className="mx-auto mb-4">
                <XCircle className="w-16 h-16 text-destructive mx-auto" />
              </div>
              <CardTitle className="text-3xl font-bold">Thanh toán chưa hoàn tất</CardTitle>
              <CardDescription className="text-base mt-2">
                Giao dịch thất bại hoặc đã hết hạn
              </CardDescription>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4">
                <Loader2 className="w-16 h-16 text-amber-500 mx-auto" />
              </div>
              <CardTitle className="text-2xl font-bold">Đang chờ xác nhận</CardTitle>
              <CardDescription className="text-base mt-2">
                {verifyState === "unauthenticated"
                  ? "Đăng nhập để kiểm tra trạng thái thanh toán"
                  : "IPN có thể mất vài phút. Kiểm tra lại trong đơn hàng."}
              </CardDescription>
            </>
          )}
        </CardHeader>

        {!loading && (
          <CardContent className="space-y-4">
            {verifyState === "confirmed" && (
              <Alert className="bg-primary/5 border-primary/20">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm">
                  Đơn hàng đã được ghi nhận. Bạn có thể xem chi tiết trong lịch sử đơn hàng.
                </AlertDescription>
              </Alert>
            )}

            {(orderCode || orderId || transactionId || orderInvoiceNumber) && (
              <div className="bg-muted rounded-lg p-4 space-y-3 text-sm">
                {(orderCode || orderId) && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mã đơn hàng</span>
                    <span className="font-semibold">{orderCode || orderId}</span>
                  </div>
                )}
                {transactionId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mã giao dịch</span>
                    <span className="font-mono">{transactionId}</span>
                  </div>
                )}
                {orderInvoiceNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Số hóa đơn</span>
                    <span className="font-mono">{orderInvoiceNumber}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
              {verifyState === "unauthenticated" ? (
                <Button asChild size="lg" className="w-full">
                  <Link to={`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}>
                    Đăng nhập để kiểm tra
                  </Link>
                </Button>
              ) : (
                <Button onClick={() => navigate("/orders")} size="lg" className="w-full">
                  <Receipt className="w-4 h-4 mr-2" />
                  Xem đơn hàng
                </Button>
              )}
              <Button onClick={() => navigate("/")} variant="outline" size="lg" className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Về trang chủ
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default PaymentSuccess;
