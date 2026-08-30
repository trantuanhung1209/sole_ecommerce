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
import { adminMediaApi } from "@/services/ecommerceServices";
import type { RefundMethod } from "@/types/ecommerce.type";
import { validateImageFile } from "@/utils/imageUpload";
import { getErrorMessage } from "@/utils/getErrorMessage";

export type ConfirmRefundPayload = {
  amount: number;
  transactionRef: string;
  method: RefundMethod;
  proofUrl?: string;
  note?: string;
};

type RefundBankInfo = {
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
};

type ConfirmRefundDialogProps = {
  open: boolean;
  defaultAmount?: number;
  maxAmount?: number;
  refundBank?: RefundBankInfo;
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
  refundBank,
  submitting = false,
  onOpenChange,
  onSubmit,
}: ConfirmRefundDialogProps) {
  const [amount, setAmount] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [method, setMethod] = useState<RefundMethod>("BANK_TRANSFER");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(defaultAmount != null ? String(defaultAmount) : "");
      setTransactionRef("");
      setMethod("BANK_TRANSFER");
      setProofFile(null);
      setProofPreview(null);
      setNote("");
      setError("");
    }
  }, [open, defaultAmount]);

  useEffect(() => {
    if (!proofFile) {
      setProofPreview(null);
      return;
    }
    const url = URL.createObjectURL(proofFile);
    setProofPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [proofFile]);

  const handleProofChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }
    setError("");
    setProofFile(file);
  };

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
    setUploading(true);
    try {
      let proofUrl: string | undefined;
      if (proofFile) {
        proofUrl = await adminMediaApi.uploadRefundProof(proofFile);
      }
      await onSubmit({
        amount: parsedAmount,
        transactionRef: transactionRef.trim(),
        method,
        proofUrl,
        note: note.trim() || undefined,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const busy = submitting || uploading;
  const hasBankInfo = Boolean(
    refundBank?.bankName && refundBank?.accountNumber && refundBank?.accountHolder
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Xác nhận đã chuyển tiền</DialogTitle>
          <DialogDescription>
            Chỉ xác nhận sau khi đã chuyển tiền thực tế cho khách. Khách sẽ nhận thông báo hoàn tiền thành công.
          </DialogDescription>
        </DialogHeader>

        {hasBankInfo ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950 space-y-1">
            <p className="font-semibold">Tài khoản nhận hoàn của khách</p>
            <p>
              {refundBank!.bankName} · {refundBank!.accountNumber}
            </p>
            <p>Chủ TK: {refundBank!.accountHolder}</p>
          </div>
        ) : (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Yêu cầu này chưa có thông tin tài khoản nhận hoàn — liên hệ khách trước khi chuyển tiền.
          </p>
        )}

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
              disabled={busy}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="refund-txn">Mã giao dịch</Label>
            <Input
              id="refund-txn"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="VD: RF928371, FT240830..."
              disabled={busy}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="refund-method">Phương thức hoàn</Label>
            <select
              id="refund-method"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={method}
              onChange={(e) => setMethod(e.target.value as RefundMethod)}
              disabled={busy}
            >
              {REFUND_METHODS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="refund-proof">Ảnh chứng từ chuyển khoản (tuỳ chọn)</Label>
            <Input
              id="refund-proof"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleProofChange}
              disabled={busy}
            />
            <p className="text-xs text-muted-foreground">JPEG, PNG, WebP · tối đa 5MB</p>
            {proofPreview ? (
              <img src={proofPreview} alt="Xem trước chứng từ" className="mt-2 h-32 rounded-lg border object-cover" />
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="refund-note">Ghi chú nội bộ (tuỳ chọn)</Label>
            <Textarea
              id="refund-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              disabled={busy}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Hủy
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Đang lưu..." : "Xác nhận đã hoàn"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
