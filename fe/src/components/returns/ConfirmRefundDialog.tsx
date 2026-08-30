import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import type { RefundMethod } from "@/types/ecommerce.type";

export type ConfirmRefundPayload = {
  amount: number;
  transactionRef: string;
  method: RefundMethod;
  proofUrl?: string;
  note?: string;
};

type ConfirmRefundDialogProps = {
  open: boolean;
  defaultAmount?: number;
  maxAmount?: number;
  submitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: ConfirmRefundPayload) => void | Promise<void>;
};

const REFUND_METHODS: { value: RefundMethod; label: string }[] = [
  { value: "BANK_TRANSFER", label: "Chuyển khoản ngân hàng" },
  { value: "SEPAY", label: "SePay / cổng thanh toán" },
  { value: "CASH", label: "Tiền mặt" },
  { value: "OTHER", label: "Khác" },
];

export function ConfirmRefundDialog({
  open,
  defaultAmount,
  maxAmount,
  submitting = false,
  onOpenChange,
  onSubmit,
}: ConfirmRefundDialogProps) {
  const [amount, setAmount] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [method, setMethod] = useState<RefundMethod>("BANK_TRANSFER");
  const [proofUrl, setProofUrl] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setAmount(defaultAmount != null ? String(defaultAmount) : "");
      setTransactionRef("");
      setMethod("BANK_TRANSFER");
      setProofUrl("");
      setNote("");
      setError("");
    }
  }, [open, defaultAmount]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Nhập số tiền hoàn hợp lệ");
      return;
    }
    if (maxAmount != null && parsedAmount > maxAmount + 0.01) {
      setError(`Số tiền không được vượt quá ${maxAmount.toLocaleString("vi-VN")}đ`);
      return;
    }
    if (!transactionRef.trim() || transactionRef.trim().length < 3) {
      setError("Nhập mã giao dịch hoàn tiền");
      return;
    }
    setError("");
    await onSubmit({
      amount: parsedAmount,
      transactionRef: transactionRef.trim(),
      method,
      proofUrl: proofUrl.trim() || undefined,
      note: note.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Xác nhận đã chuyển tiền</DialogTitle>
          <DialogDescription>
            Chỉ xác nhận sau khi đã chuyển tiền thực tế cho khách. Khách sẽ nhận thông báo hoàn tiền thành công.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="refund-amount">Số tiền hoàn (VND)</Label>
            {maxAmount != null ? (
              <p className="text-xs text-muted-foreground">
                Trần hoàn theo tình trạng hàng: {maxAmount.toLocaleString("vi-VN")}đ
              </p>
            ) : null}
            <Input
              id="refund-amount"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="refund-txn">Mã giao dịch</Label>
            <Input
              id="refund-txn"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="VD: RF928371, FT240830..."
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="refund-method">Phương thức hoàn</Label>
            <select
              id="refund-method"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={method}
              onChange={(e) => setMethod(e.target.value as RefundMethod)}
              disabled={submitting}
            >
              {REFUND_METHODS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="refund-proof">Link ảnh/chứng từ (tuỳ chọn)</Label>
            <Input
              id="refund-proof"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://..."
              disabled={submitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="refund-note">Ghi chú nội bộ (tuỳ chọn)</Label>
            <Textarea
              id="refund-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              disabled={submitting}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Đang lưu..." : "Xác nhận đã hoàn"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
