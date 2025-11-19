"use client";

import { useState, useRef, useMemo, type FC } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/design-system/atoms/Input";
import { searchTickers } from "@/resources/mock-data/tickers";
import { useTickerStore } from "@/lib/zustand/tickerStore";
import { TickerAutocomplete } from "./TickerAutocomplete";
import { cn } from "@/lib/utils";

interface TickerSearchProps {
  className?: string;
}

const TickerSearch: FC<TickerSearchProps> = ({ className }) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { setCurrentTicker, addRecentTicker } = useTickerStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => searchTickers(query), [query]);

  const handleSelect = (ticker: string) => {
    setCurrentTicker(ticker);
    addRecentTicker(ticker);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className={cn("relative w-full max-w-md", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search ticker..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-10"
        />
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <TickerAutocomplete
            results={results}
            onSelect={handleSelect}
            className="absolute top-full mt-2 w-full z-40"
          />
        </>
      )}
    </div>
  );
};

export { TickerSearch };

