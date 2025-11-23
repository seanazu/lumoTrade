import { cn } from "@/lib/utils";

export type Sentiment = "bullish" | "bearish" | "neutral";

interface SentimentChipProps {
  sentiment: Sentiment;
  className?: string;
}

export function SentimentChip({ sentiment, className }: SentimentChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
        sentiment === "bullish" && "bg-green-500/10 text-green-500",
        sentiment === "bearish" && "bg-red-500/10 text-red-500",
        sentiment === "neutral" && "bg-gray-500/10 text-gray-500",
        className
      )}
    >
      {sentiment}
    </span>
  );
}

