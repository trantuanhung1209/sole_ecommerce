import { useEffect, useRef } from "react";

export function useChatAutoScroll(messageCount: number, loading: boolean) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
    return () => cancelAnimationFrame(frame);
  }, [messageCount, loading]);

  return bottomRef;
}
