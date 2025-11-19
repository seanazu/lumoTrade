"use client";

import { type FC } from "react";
import { GlassCard } from "@/components/design-system/organisms/GlassCard";
import { Badge } from "@/components/design-system/atoms/Badge";
import { SentimentChip } from "@/components/design-system/molecules/SentimentChip";
import { NewsItem } from "@/resources/mock-data/news";
import { ExternalLink } from "lucide-react";

interface NewsFeedTabProps {
  news: NewsItem[];
}

const NewsFeedTab: FC<NewsFeedTabProps> = ({ news }) => {
  return (
    <GlassCard>
      <h4 className="text-lg font-bold mb-4">Recent News</h4>
      <div className="space-y-4">
        {news.map((item, index) => (
          <div
            key={index}
            className="p-4 rounded-lg bg-bg-secondary hover:bg-bg-tertiary transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground">{item.source}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                </div>
                <h5 className="font-semibold mb-2">{item.headline}</h5>
                <p className="text-sm text-muted-foreground">{item.summary}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </div>
            <div className="flex items-center gap-2">
              <SentimentChip sentiment={item.sentiment} />
              <Badge variant="outline">{item.tag}</Badge>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

export { NewsFeedTab };

