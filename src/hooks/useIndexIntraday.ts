"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { IndexIntradaySeries } from "@/lib/api/types";

interface IntradayResponse {
  success: boolean;
  data: IndexIntradaySeries[];
  timestamp: number;
  error?: string;
}

const EXTENDED_MARKET_START_MINUTES = 4 * 60; // 4:00 AM ET
const REGULAR_MARKET_START_MINUTES = 9 * 60 + 30; // 9:30 AM ET
const REGULAR_MARKET_END_MINUTES = 16 * 60; // 4:00 PM ET
const EXTENDED_MARKET_END_MINUTES = 20 * 60; // 8:00 PM ET

async function fetchIntraday(symbols: string[]): Promise<IndexIntradaySeries[]> {
  const params = new URLSearchParams({
    symbols: symbols.join(","),
    limit: "1300",
  });
  const response = await fetch(
    `/api/market/indexes/intraday?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const json: IntradayResponse = await response.json();

  if (!json.success) {
    throw new Error(json.error || "Failed to fetch intraday data");
  }

  return json.data;
}

function isExtendedMarketOpen(): boolean {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });

  const parts = formatter.formatToParts(now);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const minute = parseInt(
    parts.find((p) => p.type === "minute")?.value ?? "0",
    10
  );
  const minutes = hour * 60 + minute;

  const isWeekend = weekday === "Sat" || weekday === "Sun";
  if (isWeekend) {
    return false;
  }

  return (
    minutes >= EXTENDED_MARKET_START_MINUTES &&
    minutes <= EXTENDED_MARKET_END_MINUTES
  );
}

export function useIndexIntraday(symbols: string[]) {
  const enabled = symbols.length > 0;
  const isMarketOpen = isExtendedMarketOpen();
  const refetchInterval = useMemo(
    () => (isMarketOpen ? 4000 : 60 * 1000),
    [isMarketOpen]
  );

  return useQuery({
    queryKey: ["market", "indexes", "intraday", ...symbols],
    queryFn: () => fetchIntraday(symbols),
    enabled,
    refetchInterval,
    refetchOnMount: true,
    refetchOnWindowFocus: isMarketOpen,
    staleTime: 2000,
  });
}

