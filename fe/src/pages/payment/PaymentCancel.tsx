import { useSearchParams, useNavigate } from "react-router-dom";
import { AlertCircle, Home, RotateCcw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

function PaymentCancel() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const orderId = searchParams.get("orderId");
  const orderCode = searchParams.get("orderCode");

  const handleRetry = () => {
    navigate(orderId ? "/orders" : "/checkout");
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-500/10 via-background to-orange-500/10 p-4">
      <Card className="w-full max-w-md shadow-2xl border-amber-500/20">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 relative">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center animate-scale-in">
              <AlertCircle
                className="w-12 h-12 text-amber-600"
                strokeWidth={2.5}
              />
            </div>
            <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
          </div>
          <CardTitle className="text-3xl font-bold text-amber-600">
            Thanh toán đã bị hủy
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Bạn đã hủy giao dịch thanh toán
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert className="bg-amber-500/5 border-amber-500/20">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
              Đơn hàng của bạn vẫn được lưu và chờ thanh toán
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
              Bạn có thể quay lại thanh toán bất cứ lúc nào. Đơn hàng sẽ được
              giữ trong vòng 24 giờ.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <p className="text-xs text-center font-medium text-muted-foreground">
              Lưu ý quan trọng:
            </p>
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 pl-4">
                <li>• Đơn hàng của bạn chưa được xác nhận</li>
                <li>• Vui lòng hoàn tất thanh toán trong 15 phút</li>
                <li>• Sau thời gian này, tồn kho sẽ được giải phóng</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              onClick={handleRetry}
              size="lg"
              className="w-full font-semibold bg-amber-600 hover:bg-amber-700"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Tiếp tục thanh toán
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

export default PaymentCancel;
