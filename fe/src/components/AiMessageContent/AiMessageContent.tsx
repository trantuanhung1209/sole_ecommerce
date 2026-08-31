import { formatAiAnswer } from "@/utils/aiMessage";

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

interface AiMessageContentProps {
  content: string;
}

export default function AiMessageContent({ content }: AiMessageContentProps) {
  const cleaned = formatAiAnswer(content);
  const lines = cleaned.split("\n");

  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={index} className="h-1" aria-hidden />;
        }

        const numbered = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
        if (numbered) {
          return (
            <div key={index} className="flex gap-2">
              <span className="shrink-0 font-semibold tabular-nums text-muted-foreground">
                {numbered[1]}.
              </span>
              <span className="min-w-0">{renderInline(numbered[2])}</span>
            </div>
          );
        }

        const bullet = trimmed.match(/^[-•]\s+(.+)$/);
        if (bullet) {
          return (
            <div key={index} className="flex gap-2 pl-1">
              <span className="shrink-0 text-muted-foreground">•</span>
              <span className="min-w-0">{renderInline(bullet[1])}</span>
            </div>
          );
        }

        const subBullet = trimmed.match(/^[-–]\s+(.+)$/);
        if (subBullet) {
          return (
            <div key={index} className="flex gap-2 pl-5 text-[0.92em] text-muted-foreground">
              <span className="shrink-0">–</span>
              <span className="min-w-0">{renderInline(subBullet[1])}</span>
            </div>
          );
        }

        return (
          <p key={index} className="min-w-0">
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}
