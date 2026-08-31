import { useEffect, useRef, useState } from "react";
import { ImagePlus, Mic, Plus, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type PendingImage = {
  file: File;
  previewUrl: string;
};

interface AiChatComposerProps {
  message: string;
  onMessageChange: (value: string) => void;
  loading: boolean;
  recording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSendText: () => void;
  onSendImage: (file: File, caption?: string) => void | Promise<void>;
  placeholder?: string;
  multiline?: boolean;
}

export default function AiChatComposer({
  message,
  onMessageChange,
  loading,
  recording,
  onStartRecording,
  onStopRecording,
  onSendText,
  onSendImage,
  placeholder = "Nhập câu hỏi...",
  multiline = false,
}: AiChatComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);

  useEffect(() => {
    return () => {
      if (pendingImage?.previewUrl) {
        URL.revokeObjectURL(pendingImage.previewUrl);
      }
    };
  }, [pendingImage?.previewUrl]);

  const clearPendingImage = () => {
    setPendingImage((current) => {
      if (current?.previewUrl) {
        URL.revokeObjectURL(current.previewUrl);
      }
      return null;
    });
  };

  const handleImagePick = (file: File) => {
    setPendingImage((current) => {
      if (current?.previewUrl) {
        URL.revokeObjectURL(current.previewUrl);
      }
      return { file, previewUrl: URL.createObjectURL(file) };
    });
    setAttachOpen(false);
  };

  const handleSubmit = async () => {
    if (loading || recording) return;

    if (pendingImage) {
      const { file } = pendingImage;
      const caption = message.trim() || undefined;
      clearPendingImage();
      onMessageChange("");
      await onSendImage(file, caption);
      return;
    }

    if (message.trim()) {
      onSendText();
    }
  };

  const canSend = Boolean(pendingImage || message.trim()) && !loading && !recording;

  const inputProps = {
    value: message,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onMessageChange(e.target.value),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && multiline) {
        e.preventDefault();
        void handleSubmit();
      }
    },
    placeholder: pendingImage ? "Mô tả thêm về ảnh (tuỳ chọn)..." : placeholder,
    disabled: loading || recording,
  };

  return (
    <div className="space-y-2">
      {recording && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            Đang ghi âm...
          </span>
          <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={onStopRecording}>
            Dừng & gửi
          </Button>
        </div>
      )}

      {pendingImage && (
        <div className="relative inline-block max-w-full">
          <img
            src={pendingImage.previewUrl}
            alt="Xem trước"
            className="max-h-28 rounded-lg border object-cover"
          />
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute -right-2 -top-2 h-6 w-6 rounded-full shadow"
            onClick={clearPendingImage}
            aria-label="Xóa ảnh"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.webp,.heic,.heif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImagePick(file);
            e.target.value = "";
          }}
        />

        <Popover open={attachOpen} onOpenChange={setAttachOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={multiline ? "h-11 w-11 shrink-0" : "shrink-0"}
              disabled={loading || recording}
              aria-label="Đính kèm"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-44 p-1">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4" />
              Chọn ảnh
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
              onClick={() => {
                setAttachOpen(false);
                onStartRecording();
              }}
            >
              <Mic className="h-4 w-4" />
              Ghi âm giọng nói
            </button>
          </PopoverContent>
        </Popover>

        {multiline ? (
          <Textarea {...inputProps} className="min-h-11 flex-1 resize-none rounded-lg" />
        ) : (
          <Input {...inputProps} className="flex-1" />
        )}

        <Button
          type="button"
          className={multiline ? "h-11 shrink-0 rounded-lg bg-[#111111] text-white" : "shrink-0"}
          disabled={!canSend}
          onClick={() => void handleSubmit()}
          aria-label="Gửi"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
