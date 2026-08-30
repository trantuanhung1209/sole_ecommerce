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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type ReturnActionType = "confirm" | "reject" | "approve" | "requestRefund";

type ReturnActionDialogProps = {
  open: boolean;
  action: ReturnActionType | null;
  submitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (action: ReturnActionType, note: string) => void | Promise<void>;
};

const ACTION_COPY: Record<
  ReturnActionType,
  { title: string; description: string; noteLabel: string; noteRequired: boolean; noteMin?: number; submit: string }
> = {
  confirm: {
    title: "Xác nhận yêu cầu trả",
    description: "Xác nhận hồ sơ hợp lệ trước khi chuyển quản lý duyệt.",
    noteLabel: "Ghi chú nội bộ (tuỳ chọn)",
    noteRequired: false,
    submit: "Xác nhận",
  },
  reject: {
    title: "Từ chối yêu cầu trả",
    description: "Lý do từ chối sẽ được gửi cho khách. Đơn hàng sẽ được khôi phục trạng thái.",
    noteLabel: "Lý do từ chối",
    noteRequired: true,
    noteMin: 10,
    submit: "Từ chối",
  },
  approve: {
    title: "Duyệt trả hàng",
    description: "Khách sẽ được thông báo gửi hàng về trong 7 ngày. Chưa hoàn tiền ở bước này.",
    noteLabel: "Ghi chú cho khách / nội bộ (tuỳ chọn)",
    noteRequired: false,
    submit: "Duyệt trả hàng",
  },
  requestRefund: {
    title: "Yêu cầu hoàn tiền",
    description:
      "Chấp nhận hoàn tiền trên hệ thống. Khách được thông báo đang xử lý — chưa coi là đã chuyển tiền. Sau đó chuyển khoản thực tế rồi xác nhận.",
    noteLabel: "Ghi chú nội bộ (tuỳ chọn)",
    noteRequired: false,
    submit: "Tạo yêu cầu hoàn tiền",
  },
};

export function ReturnActionDialog({
  open,
  action,
  submitting = false,
  onOpenChange,
  onSubmit,
}: ReturnActionDialogProps) {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setNote("");
      setError("");
    }
  }, [open, action]);

  if (!action) return null;

  const copy = ACTION_COPY[action];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = note.trim();
    if (copy.noteRequired && !value) {
      setError("Vui lòng nhập nội dung");
      return;
    }
    if (copy.noteMin && value.length < copy.noteMin) {
      setError(`Tối thiểu ${copy.noteMin} ký tự`);
      return;
    }
    setError("");
    await onSubmit(action, value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="return-action-note">{copy.noteLabel}</Label>
            <Textarea
              id="return-action-note"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (error) setError("");
              }}
              placeholder={copy.noteRequired ? "Mô tả lý do từ chối cho khách..." : "Ghi chú..."}
              rows={4}
              disabled={submitting}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant={action === "reject" ? "destructive" : "default"}
              disabled={submitting}
            >
              {submitting ? "Đang xử lý..." : copy.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
