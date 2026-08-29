import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Home, Receipt, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const orderId = searchParams.get("orderId");
  const orderCode = searchParams.get("orderCode");
  const transactionId =
    searchParams.get("transaction_id") || searchParams.get("transactionId");
  const orderInvoiceNumber =
    searchParams.get("order_invoice_number") || searchParams.get("orderInvoiceNumber");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/20">
        <CardHeader className="text-center pb-4">
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
              <CardTitle className="text-2xl">Đang xử lý thanh toán...</CardTitle>
              <CardDescription>Vui lòng chờ trong giây lát</CardDescription>
            </div>
          ) : (
            <>
              <div className="mx-auto mb-4">
                <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
              </div>
              <CardTitle className="text-3xl font-bold">Thanh toán thành công!</CardTitle>
              <CardDescription className="text-base mt-2">
                Giao dịch của bạn đã được xác nhận
              </CardDescription>
            </>
          )}
        </CardHeader>

        {!loading && (
          <CardContent className="space-y-4">
            <Alert className="bg-primary/5 border-primary/20">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                Đơn hàng đã được ghi nhận. Bạn có thể xem chi tiết trong lịch sử đơn hàng.
              </AlertDescription>
            </Alert>

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
              <Button onClick={() => navigate("/orders")} size="lg" className="w-full">
                <Receipt className="w-4 h-4 mr-2" />
                Xem đơn hàng
              </Button>
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
