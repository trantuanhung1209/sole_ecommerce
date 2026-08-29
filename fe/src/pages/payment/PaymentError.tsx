import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { XCircle, Home, RotateCcw, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAppSelector } from "@/hooks/useRedux";
import { usePaymentVerification } from "@/hooks/usePaymentVerification";

function PaymentError() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isLoggedIn = useAppSelector((state) => state.auth.isLoggedIn);
  const orderId = searchParams.get("orderId");
  const orderCode = searchParams.get("orderCode");
  const errorMessage = searchParams.get("message") || "Đã có lỗi xảy ra trong quá trình thanh toán";
  const verifyState = usePaymentVerification(orderId, Boolean(isLoggedIn), "failure");
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (verifyState !== "loading") setShowContent(true);
  }, [verifyState]);

  const beConfirmedFailed = verifyState === "failed";
  const beSaysPaid = verifyState === "confirmed";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/10 via-background to-destructive/5 p-4">
      <Card className="w-full max-w-md shadow-2xl border-destructive/20">
        <CardHeader className="text-center pb-4">
          {!showContent ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-16 h-16 text-destructive animate-spin" />
              <CardTitle className="text-2xl">Đang xác nhận trạng thái...</CardTitle>
            </div>
          ) : beSaysPaid ? (
            <>
              <CardTitle className="text-2xl font-bold text-primary">Thanh toán đã thành công</CardTitle>
              <CardDescription>Hệ thống ghi nhận đơn đã thanh toán — vui lòng kiểm tra đơn hàng.</CardDescription>
            </>
          ) : (
            <>
              <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <CardTitle className="text-3xl font-bold text-destructive">Thanh toán thất bại</CardTitle>
              <CardDescription className="text-base mt-2">
                {beConfirmedFailed ? "Giao dịch không thành công trên hệ thống" : "Giao dịch không thể hoàn tất"}
              </CardDescription>
            </>
          )}
        </CardHeader>

        {showContent && (
          <CardContent className="space-y-4">
            {!beSaysPaid && (
              <Alert variant="destructive" className="bg-destructive/5">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Lỗi thanh toán</AlertTitle>
                <AlertDescription className="text-sm mt-1">{errorMessage}</AlertDescription>
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
                    Đăng nhập để kiểm tra
                  </Link>
                </Button>
              ) : (
                <Button onClick={() => navigate(orderId ? "/orders" : "/checkout")} size="lg" className="w-full">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {beSaysPaid ? "Xem đơn hàng" : "Thử lại thanh toán"}
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

export default PaymentError;
