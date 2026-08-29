import { useState } from "react";
import { Send, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { aiApi } from "@/services/ecommerceServices";
import { useAppSelector } from "@/hooks/useRedux";
import { Link } from "react-router-dom";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function AiChatPage() {
  const isLoggedIn = useAppSelector((state) => state.auth.isLoggedIn);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Xin chào! Tôi là trợ lý SOLE. Hỏi tôi về sản phẩm, đơn hàng hoặc chính sách đổi trả.",
    },
  ]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await aiApi.chat(text, conversationId);
      setConversationId(res.conversationId);
      setMessages((prev) => [...prev, { role: "assistant", content: res.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Không thể kết nối trợ lý AI. Vui lòng thử lại sau." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center space-y-4">
        <Bot className="w-12 h-12 mx-auto text-primary" />
        <h1 className="text-2xl font-bold">Trợ lý AI SOLE</h1>
        <p className="text-muted-foreground">Đăng nhập để chat với trợ lý mua sắm thông minh.</p>
        <Button asChild>
          <Link to="/login?redirect=/ai-chat">Đăng nhập</Link>
        </Button>
      </div>
    );
  }

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
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang trả lời...
              </div>
            )}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <Input
              placeholder="Nhập câu hỏi..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
