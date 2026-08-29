import { useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import publicAxios from "@/utils/publicAxios";
import type { ApiResponse } from "@/types/api.type";

interface ChatMessage {
  role: "USER" | "ASSISTANT";
  content: string;
}

interface AiChatResponse {
  conversationId: string;
  answer: string;
  route: string;
  ctaLinks: string[];
}

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "ASSISTANT",
      content:
        "Chào bạn, mình là trợ lý SOLE. Mình có thể gợi ý sản phẩm, tư vấn size, kiểm tra chính sách đổi trả và hướng dẫn checkout.",
    },
  ]);

  const sendMessage = async () => {
    const content = message.trim();
    if (!content || loading) return;
    setMessage("");
    setMessages((current) => [...current, { role: "USER", content }]);
    setLoading(true);
    try {
      const response = await publicAxios.post<ApiResponse<AiChatResponse>>("/ai/chat", {
        conversationId,
        message: content,
      });
      setConversationId(response.data.data.conversationId);
      setMessages((current) => [
        ...current,
        { role: "ASSISTANT", content: response.data.data.answer },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "ASSISTANT",
          content: "Mình chưa kết nối được AI lúc này. Bạn có thể thử lại sau vài giây.",
        },
      ]);
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
              <p className="text-xs text-[#6B7280]">OpenAI qua backend adapter</p>
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
                  item.role === "USER"
                    ? "ml-8 bg-[#111111] text-white"
                    : "mr-8 border border-[#E5E7EB] bg-white text-[#111111]"
                }`}
              >
                {item.content}
              </div>
            ))}
            {loading && (
              <div className="mr-8 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#6B7280]">
                Đang trả lời...
              </div>
            )}
          </div>

          <footer className="border-t border-[#E5E7EB] p-3">
            <div className="flex gap-2">
              <Textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Hỏi về size, sản phẩm, đổi trả..."
                className="min-h-11 resize-none rounded-lg"
              />
              <Button className="h-11 rounded-lg bg-[#111111] text-white" onClick={sendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
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
