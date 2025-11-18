import * as React from "react";
import { ExternalLink } from "lucide-react";
import { Badge } from "../atoms/Badge";
import { SentimentChip, Sentiment } from "./SentimentChip";
import { cn } from "@/lib/utils";

export interface NewsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  source: string;
  headline: string;
  sentiment?: Sentiment;
  tag?: string;
  time?: string;
  onClick?: () => void;
}

const NewsCard = React.forwardRef<HTMLDivElement, NewsCardProps>(
  (
    { source, headline, sentiment, tag, time, onClick, className, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "glass-card px-4 py-3 min-w-[300px] hover:border-accent-cyan/50 transition-all cursor-pointer",
          className
        )}
        onClick={onClick}
        {...props}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{source}</span>
            {time && (
              <span className="text-xs text-muted-foreground">{time}</span>
            )}
          </div>
          <p className="text-sm font-medium line-clamp-2">{headline}</p>
          <div className="flex items-center gap-2">
            {sentiment && <SentimentChip sentiment={sentiment} />}
            {tag && <Badge variant="outline">{tag}</Badge>}
            <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }
);
NewsCard.displayName = "NewsCard";

export { NewsCard };

