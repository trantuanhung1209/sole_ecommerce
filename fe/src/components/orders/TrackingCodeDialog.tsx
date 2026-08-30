import { useEffect, useState } from "react";
import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TrackingCodeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderCode?: string;
  submitting?: boolean;
  onSubmit: (trackingCode: string) => void | Promise<void>;
};

export function TrackingCodeDialog({
  open,
  onOpenChange,
  orderCode,
  submitting = false,
  onSubmit,
}: TrackingCodeDialogProps) {
  const [trackingCode, setTrackingCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setTrackingCode("");
      setError("");
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = trackingCode.trim();
    if (!value) {
      setError("Vui lòng nhập mã vận đơn");
      return;
    }
    setError("");
    await onSubmit(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Nhập mã vận đơn
          </DialogTitle>
          <DialogDescription>
            {orderCode
              ? `Đơn ${orderCode} sẽ chuyển sang trạng thái Đang giao. Nhập mã tracking để khách theo dõi.`
              : "Nhập mã vận đơn để khách hàng theo dõi giao hàng."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tracking-code">Mã vận đơn</Label>
            <Input
              id="tracking-code"
              value={trackingCode}
              onChange={(e) => {
                setTrackingCode(e.target.value);
                if (error) setError("");
              }}
              placeholder="VD: GHN123456789, VNPOST-ABC123"
              autoFocus
              disabled={submitting}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Đang lưu..." : "Xác nhận giao hàng"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
