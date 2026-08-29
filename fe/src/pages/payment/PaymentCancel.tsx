import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { AlertCircle, Home, RotateCcw, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAppSelector } from "@/hooks/useRedux";
import { usePaymentVerification } from "@/hooks/usePaymentVerification";

function PaymentCancel() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isLoggedIn = useAppSelector((state) => state.auth.isLoggedIn);
  const orderId = searchParams.get("orderId");
  const orderCode = searchParams.get("orderCode");
  const verifyState = usePaymentVerification(orderId, Boolean(isLoggedIn), "cancel");
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (verifyState !== "loading") setShowContent(true);
  }, [verifyState]);

  const paid = verifyState === "confirmed";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-500/10 via-background to-orange-500/10 p-4">
      <Card className="w-full max-w-md shadow-2xl border-amber-500/20">
        <CardHeader className="text-center pb-4">
          {!showContent ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-16 h-16 text-amber-600 animate-spin" />
              <CardTitle className="text-2xl">Đang kiểm tra đơn hàng...</CardTitle>
            </div>
          ) : paid ? (
            <>
              <CardTitle className="text-2xl font-bold text-primary">Thanh toán đã hoàn tất</CardTitle>
              <CardDescription>Đơn hàng đã được thanh toán trước khi bạn hủy cổng.</CardDescription>
            </>
          ) : (
            <>
              <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
              <CardTitle className="text-3xl font-bold text-amber-600">Thanh toán đã bị hủy</CardTitle>
              <CardDescription className="text-base mt-2">Bạn đã hủy giao dịch trên cổng thanh toán</CardDescription>
            </>
          )}
        </CardHeader>

        {showContent && (
          <CardContent className="space-y-4">
            {!paid && (
              <Alert className="bg-amber-500/5 border-amber-500/20">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
                  {verifyState === "cancelled"
                    ? "Đơn hàng vẫn chờ thanh toán — tồn kho được giữ trong ~15 phút."
                    : "Đơn hàng có thể đã hết hạn hoặc bị hủy."}
                </AlertDescription>
              </Alert>
            )}

            {(orderCode || orderId) && (
              <div className="bg-muted rounded-lg p-4 flex justify-between text-sm">
                <span className="text-muted-foreground">Mã đơn hàng</span>
                <span className="font-semibold">{orderCode || orderId}</span>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
              {verifyState === "unauthenticated" ? (
                <Button asChild size="lg" className="w-full">
                  <Link to={`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}>
                    Đăng nhập để tiếp tục
                  </Link>
                </Button>
              ) : (
                <Button
                  onClick={() => navigate(paid ? "/orders" : orderId ? "/orders" : "/checkout")}
                  size="lg"
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {paid ? "Xem đơn hàng" : "Tiếp tục thanh toán"}
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

export default PaymentCancel;
