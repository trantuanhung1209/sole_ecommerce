import { useRef, useState } from "react";
import { Bot, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AiSuggestedProducts from "@/components/AiSuggestedProducts/AiSuggestedProducts";
import AiChatComposer from "@/components/AiChatComposer/AiChatComposer";
import { aiApi } from "@/services/ecommerceServices";
import AiMessageContent from "@/components/AiMessageContent/AiMessageContent";
import { useChatAutoScroll } from "@/hooks/useChatAutoScroll";
import { getSupportedAudioFormat, isRecordingTooShort, voiceFilename } from "@/utils/audioRecording";
import type { AiChatMessage, AiChatResponse } from "@/types/ai.type";

export default function AiChatPage() {
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      role: "assistant",
      content: "Xin chào! Tôi là trợ lý SOLE. Hỏi tôi về sản phẩm, đơn hàng hoặc chính sách đổi trả.",
    },
  ]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number | null>(null);
  const scrollAnchorRef = useChatAutoScroll(messages.length, loading);

  const appendUserMessage = (content: string, extras?: Partial<AiChatMessage>) => {
    setMessages((prev) => [...prev, { role: "user", content, ...extras }]);
  };

  const appendAssistantResponse = (data: AiChatResponse) => {
    setConversationId(data.conversationId);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: data.answer,
        suggestedProducts: data.suggestedProducts,
        warnings: data.warnings,
        sourceImageUrl: data.sourceImageUrl,
      },
    ]);
  };

  const appendAssistantError = (content: string) => {
    setMessages((prev) => [...prev, { role: "assistant", content }]);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    appendUserMessage(text);
    setInput("");
    setLoading(true);
    try {
      const res = await aiApi.chat(text, conversationId);
      appendAssistantResponse(res);
    } catch {
      appendAssistantError("Không thể kết nối trợ lý AI. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const format = getSupportedAudioFormat();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, format.mimeType ? { mimeType: format.mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const durationMs = recordingStartedAtRef.current != null
          ? Date.now() - recordingStartedAtRef.current
          : 0;
        recordingStartedAtRef.current = null;

        if (isRecordingTooShort(durationMs)) {
          appendAssistantError("Ghi âm quá ngắn, vui lòng giữ nút và nói rõ hơn.");
          return;
        }

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || format.mimeType || "audio/webm",
        });
        appendUserMessage("🎤 Đang xử lý giọng nói...");
        setLoading(true);
        try {
          const res = await aiApi.chatVoice(blob, conversationId, voiceFilename(format.extension));
          setMessages((prev) => {
            const next = [...prev];
            for (let i = next.length - 1; i >= 0; i--) {
              if (next[i].role === "user" && next[i].content.startsWith("🎤 Đang")) {
                next[i] = {
                  ...next[i],
                  content: res.transcript ? `🎤 ${res.transcript}` : "🎤 Tin nhắn thoại",
                  transcript: res.transcript,
                };
                break;
              }
            }
            return next;
          });
          appendAssistantResponse(res);
        } catch {
          setMessages((prev) => {
            const next = prev.filter((msg) => !(msg.role === "user" && msg.content.startsWith("🎤 Đang")));
            return next;
          });
          appendAssistantError("Không nghe rõ hoặc không thể xử lý giọng nói. Vui lòng thử lại gần micro hơn.");
        } finally {
          setLoading(false);
        }
      };
      mediaRecorderRef.current = recorder;
      recordingStartedAtRef.current = Date.now();
      recorder.start();
      setRecording(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Không thể truy cập microphone." },
      ]);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const sendImage = async (file: File, caption?: string) => {
    const previewUrl = URL.createObjectURL(file);
    const userContent = caption ? `📷 ${caption}` : "📷 Đã gửi ảnh tìm kiếm";
    appendUserMessage(userContent, { sourceImageUrl: previewUrl });
    setLoading(true);
    try {
      const res = await aiApi.chatImage(file, conversationId, caption);
      appendAssistantResponse(res);
    } catch {
      URL.revokeObjectURL(previewUrl);
      appendAssistantError("Không thể xử lý ảnh. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Trợ lý AI SOLE
          </CardTitle>
          <CardDescription>Gợi ý sản phẩm, tra cứu đơn hàng, chính sách đổi trả</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-[400px] overflow-y-auto space-y-3 rounded-lg border p-4 bg-muted/30">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-background border"
                }`}
              >
                {msg.sourceImageUrl && msg.role === "user" ? (
                  <img src={msg.sourceImageUrl} alt="Uploaded" className="mb-2 max-h-32 rounded object-cover" />
                ) : null}
                {msg.role === "assistant" ? <AiMessageContent content={msg.content} /> : msg.content}
                {msg.warnings?.map((warning) => (
                  <p key={warning} className="mt-2 text-xs text-amber-700">
                    {warning}
                  </p>
                ))}
                {msg.suggestedProducts ? (
                  <AiSuggestedProducts products={msg.suggestedProducts} />
                ) : null}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang trả lời...
              </div>
            )}
            <div ref={scrollAnchorRef} />
          </div>

          <AiChatComposer
            message={input}
            onMessageChange={setInput}
            loading={loading}
            recording={recording}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onSendText={send}
            onSendImage={sendImage}
            placeholder="Nhập câu hỏi..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
