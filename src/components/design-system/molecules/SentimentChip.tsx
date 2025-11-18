import * as React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "../atoms/Badge";

export type Sentiment = "bullish" | "bearish" | "neutral";

export interface SentimentChipProps {
  sentiment: Sentiment;
  className?: string;
}

const sentimentConfig = {
  bullish: {
    icon: TrendingUp,
    label: "Bullish",
    variant: "bullish" as const,
  },
  bearish: {
    icon: TrendingDown,
    label: "Bearish",
    variant: "bearish" as const,
  },
  neutral: {
    icon: Minus,
    label: "Neutral",
    variant: "neutral" as const,
  },
};

const SentimentChip: React.FC<SentimentChipProps> = ({
  sentiment,
  className,
}) => {
  const config = sentimentConfig[sentiment];
  const IconComponent = config.icon;

  return (
    <Badge variant={config.variant} className={className}>
      <IconComponent className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
};

export { SentimentChip };

