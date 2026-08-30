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
import type { ReturnItemCondition } from "@/types/ecommerce.type";

export type MarkReceivedPayload = {
  itemCondition: ReturnItemCondition;
  receiveNote?: string;
  note?: string;
};

type MarkReceivedDialogProps = {
  open: boolean;
  submitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: MarkReceivedPayload) => void | Promise<void>;
};

const CONDITIONS: { value: ReturnItemCondition; label: string; hint: string }[] = [
  { value: "GOOD", label: "Hàng tốt — đủ phụ kiện", hint: "Restock 100%, hoàn tối đa 100% lineTotal" },
  {
    value: "DAMAGED",
    label: "Hàng hỏng / móp méo",
    hint: "Không restock, hoàn tối đa 50% lineTotal — bắt buộc ghi chú",
  },
  {
    value: "INCOMPLETE",
    label: "Thiếu phụ kiện / không đủ bộ",
    hint: "Không restock, hoàn tối đa 30% lineTotal — bắt buộc ghi chú",
  },
];

export function MarkReceivedDialog({
  open,
  submitting = false,
  onOpenChange,
  onSubmit,
}: MarkReceivedDialogProps) {
  const [itemCondition, setItemCondition] = useState<ReturnItemCondition>("GOOD");
  const [receiveNote, setReceiveNote] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setItemCondition("GOOD");
      setReceiveNote("");
      setNote("");
      setError("");
    }
  }, [open]);

  const selected = CONDITIONS.find((c) => c.value === itemCondition);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (itemCondition !== "GOOD" && receiveNote.trim().length < 10) {
      setError("Hàng hỏng/thiếu phải ghi chú kiểm tra (tối thiểu 10 ký tự)");
      return;
    }
    setError("");
    await onSubmit({
      itemCondition,
      receiveNote: receiveNote.trim() || undefined,
      note: note.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Xác nhận đã nhận hàng trả</DialogTitle>
          <DialogDescription>
            Ghi nhận tình trạng hàng thực tế. Quyết định restock và trần hoàn tiền theo chính sách shop.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item-condition">Tình trạng hàng</Label>
            <select
              id="item-condition"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={itemCondition}
              onChange={(e) => setItemCondition(e.target.value as ReturnItemCondition)}
              disabled={submitting}
            >
              {CONDITIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {selected ? <p className="text-xs text-muted-foreground">{selected.hint}</p> : null}
          </div>
          {itemCondition !== "GOOD" ? (
            <div className="space-y-2">
              <Label htmlFor="receive-note">Ghi chú kiểm tra hàng</Label>
              <Textarea
                id="receive-note"
                value={receiveNote}
                onChange={(e) => {
                  setReceiveNote(e.target.value);
                  if (error) setError("");
                }}
                rows={3}
                placeholder="Mô tả hư hỏng, thiếu phụ kiện..."
                disabled={submitting}
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="receive-staff-note">Ghi chú nội bộ (tuỳ chọn)</Label>
            <Textarea
              id="receive-staff-note"
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
              {submitting ? "Đang lưu..." : "Xác nhận nhận hàng"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
