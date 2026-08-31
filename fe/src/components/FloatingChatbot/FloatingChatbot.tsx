import { useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import AiSuggestedProducts from "@/components/AiSuggestedProducts/AiSuggestedProducts";
import AiChatComposer from "@/components/AiChatComposer/AiChatComposer";
import { aiApi } from "@/services/ecommerceServices";
import AiMessageContent from "@/components/AiMessageContent/AiMessageContent";
import { useChatAutoScroll } from "@/hooks/useChatAutoScroll";
import { getSupportedAudioFormat, isRecordingTooShort, voiceFilename } from "@/utils/audioRecording";
import type { AiChatMessage, AiChatResponse } from "@/types/ai.type";

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number | null>(null);
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      role: "assistant",
      content:
        "Chào bạn, mình là trợ lý SOLE. Mình có thể gợi ý sản phẩm, tư vấn size, kiểm tra chính sách đổi trả và hướng dẫn checkout.",
    },
  ]);

  const scrollAnchorRef = useChatAutoScroll(messages.length, loading);

  const appendUserMessage = (content: string, extras?: Partial<AiChatMessage>) => {
    setMessages((current) => [...current, { role: "user", content, ...extras }]);
  };

  const appendAssistantResponse = (data: AiChatResponse) => {
    setConversationId(data.conversationId);
    setMessages((current) => [
      ...current,
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
    setMessages((current) => [...current, { role: "assistant", content }]);
  };

  const sendMessage = async () => {
    const content = message.trim();
    if (!content || loading) return;
    appendUserMessage(content);
    setMessage("");
    setLoading(true);
    try {
      const data = await aiApi.chat(content, conversationId);
      appendAssistantResponse(data);
    } catch {
      appendAssistantError("Mình chưa kết nối được AI lúc này. Bạn có thể thử lại sau vài giây.");
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
          setMessages((current) => {
            const next = [...current];
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
          setMessages((current) => {
            const next = current.filter((msg) => !(msg.role === "user" && msg.content.startsWith("🎤 Đang")));
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
      setMessages((current) => [
        ...current,
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
      appendAssistantError("Không thể xử lý ảnh.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <section className="fixed bottom-24 right-6 z-50 flex h-[560px] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-2xl">
          <header className="flex h-14 items-center justify-between border-b border-[#E5E7EB] px-4">
            <div>
              <h2 className="text-sm font-black text-[#111111]">SOLE AI</h2>
              <p className="text-xs text-[#6B7280]">Tư vấn sản phẩm & chính sách</p>
            </div>
            <Button variant="outline" size="icon" onClick={() => setIsOpen(false)} aria-label="Close chat">
              <X className="h-4 w-4" />
            </Button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-[#F7F7F5] p-4">
            {messages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={`rounded-lg px-3 py-2 text-sm ${
                  item.role === "user"
                    ? "ml-8 bg-[#111111] text-white"
                    : "mr-8 border border-[#E5E7EB] bg-white text-[#111111]"
                }`}
              >
                {item.sourceImageUrl && item.role === "user" ? (
                  <img src={item.sourceImageUrl} alt="Uploaded" className="mb-2 max-h-24 rounded object-cover" />
                ) : null}
                {item.role === "assistant" ? <AiMessageContent content={item.content} /> : item.content}
                {item.warnings?.map((warning) => (
                  <p key={warning} className="mt-2 text-xs text-amber-700">
                    {warning}
                  </p>
                ))}
                {item.suggestedProducts ? (
                  <AiSuggestedProducts products={item.suggestedProducts} />
                ) : null}
              </div>
            ))}
            {loading && (
              <div className="mr-8 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#6B7280]">
                Đang trả lời...
              </div>
            )}
            <div ref={scrollAnchorRef} />
          </div>

          <footer className="border-t border-[#E5E7EB] p-3">
            <AiChatComposer
              message={message}
              onMessageChange={setMessage}
              loading={loading}
              recording={recording}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
              onSendText={sendMessage}
              onSendImage={sendImage}
              placeholder="Hỏi về size, sản phẩm, đổi trả..."
              multiline
            />
          </footer>
        </section>
      )}

      <Button
        onClick={() => setIsOpen((current) => !current)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-[#111111] text-white shadow-2xl"
        aria-label={isOpen ? "Close SOLE AI" : "Open SOLE AI"}
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </Button>
    </>
  );
}
