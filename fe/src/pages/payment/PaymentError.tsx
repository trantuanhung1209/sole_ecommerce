import { useSearchParams, useNavigate } from "react-router-dom";
import { XCircle, Home, RotateCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function PaymentError() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const orderId = searchParams.get("orderId");
  const orderCode = searchParams.get("orderCode");
  const errorMessage =
    searchParams.get("message") ||
    "Đã có lỗi xảy ra trong quá trình thanh toán";

  const handleRetry = () => {
    navigate(orderId ? "/orders" : "/checkout");
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/10 via-background to-destructive/5 p-4">
      <Card className="w-full max-w-md shadow-2xl border-destructive/20">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 relative">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center animate-scale-in">
              <XCircle
                className="w-12 h-12 text-destructive"
                strokeWidth={2.5}
              />
            </div>
            <div className="absolute inset-0 rounded-full bg-destructive/20 animate-ping" />
          </div>
          <CardTitle className="text-3xl font-bold text-destructive">
            Thanh toán thất bại
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Giao dịch không thể hoàn tất
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant="destructive" className="bg-destructive/5">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Lỗi thanh toán</AlertTitle>
            <AlertDescription className="text-sm mt-1">
              {errorMessage}
            </AlertDescription>
          </Alert>

          {(orderCode || orderId) && (
            <div className="bg-muted rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">
                  Mã đơn hàng
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {orderCode || orderId}
                </span>
              </div>
            </div>
          )}

          <div className="bg-accent/30 rounded-lg p-4">
            <p className="text-sm text-center text-muted-foreground leading-relaxed">
              Vui lòng kiểm tra lại thông tin thanh toán hoặc thử phương thức
              khác. Nếu vấn đề vẫn tiếp diễn, vui lòng liên hệ bộ phận hỗ trợ.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <p className="text-xs text-center text-muted-foreground">
              Một số nguyên nhân có thể gây lỗi:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 pl-6">
              <li>• Số dư tài khoản không đủ</li>
              <li>• Thông tin thẻ không chính xác</li>
              <li>• Kết nối mạng không ổn định</li>
              <li>• Hệ thống ngân hàng đang bảo trì</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              onClick={handleRetry}
              size="lg"
              className="w-full font-semibold bg-destructive hover:bg-destructive/90"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Thử lại thanh toán
            </Button>
            <Button
              onClick={handleBackToHome}
              variant="outline"
              size="lg"
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Về trang chủ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PaymentError;
