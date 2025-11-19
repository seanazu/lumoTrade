"use client";

import { type FC } from "react";
import { TickerSearchResult } from "@/types/ticker";
import { GlassCard } from "@/components/design-system/organisms/GlassCard";
import { cn } from "@/lib/utils";

interface TickerAutocompleteProps {
  results: TickerSearchResult[];
  onSelect: (ticker: string) => void;
  className?: string;
}

const TickerAutocomplete: FC<TickerAutocompleteProps> = ({
  results,
  onSelect,
  className,
}) => {
  if (results.length === 0) {
    return (
      <GlassCard className={cn("p-4", className)}>
        <p className="text-sm text-muted-foreground text-center">
          No tickers found
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className={cn("p-2", className)}>
      <div className="space-y-1">
        {results.map((result) => (
          <button
            key={result.symbol}
            onClick={() => onSelect(result.symbol)}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent-cyan/10 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{result.symbol}</p>
                <p className="text-xs text-muted-foreground">{result.name}</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {result.exchange}
              </span>
            </div>
          </button>
        ))}
      </div>
    </GlassCard>
  );
};

export { TickerAutocomplete };

