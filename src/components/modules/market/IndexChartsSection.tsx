"use client";

import { useMemo } from "react";
import { type FC } from "react";
import { DateTime } from "luxon";
import { AlertCircle, BarChart3, Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import { GlassCard } from "@/components/design-system/atoms/GlassCard";
import { IndexData } from "@/resources/mock-data/indexes";
import { MarketSession } from "@/lib/api/types";
import { useIndexIntraday } from "@/hooks/useIndexIntraday";

interface IndexChartsSectionProps {
  indexes: IndexData[];
}

type ChartPoint = {
  ts: number;
  price: number;
  session: MarketSession;
  label: string;
};

interface SeriesChartMeta {
  points: ChartPoint[];
  sessionStart: number;
  regularStart: number;
  regularEnd: number;
  sessionEnd: number;
  ticks: number[];
}

const PRE_MARKET_COLOR = "rgba(250, 204, 21, 0.15)";
const AFTER_MARKET_COLOR = "rgba(59, 130, 246, 0.15)";

function formatIsraelHour(timestamp: number) {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    hour: "2-digit",
    hour12: false,
  }).format(new Date(timestamp));
}

function formatIsraelTooltip(timestamp: number) {
  return new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(timestamp));
}

function generateHourlyTicks(startIso: string, endIso: string) {
  const zone = "Asia/Jerusalem";
  const start = DateTime.fromISO(startIso).setZone(zone);
  const end = DateTime.fromISO(endIso).setZone(zone);

  let cursor = start.startOf("hour");
  if (cursor < start) {
    cursor = cursor.plus({ hours: 1 });
  }

  const ticks: number[] = [];
  while (cursor <= end) {
    ticks.push(cursor.toUTC().toMillis());
    cursor = cursor.plus({ hours: 1 });
  }

  return ticks;
}

function buildSessionAreas(meta: SeriesChartMeta) {
  const areas: Array<{
    session: MarketSession;
    x1: number;
    x2: number;
    fill: string;
  }> = [];

  if (meta.regularStart > meta.sessionStart) {
    areas.push({
      session: "pre",
      x1: meta.sessionStart,
      x2: meta.regularStart,
      fill: PRE_MARKET_COLOR,
    });
  }

  if (meta.sessionEnd > meta.regularEnd) {
    areas.push({
      session: "after",
      x1: meta.regularEnd,
      x2: meta.sessionEnd,
      fill: AFTER_MARKET_COLOR,
    });
  }

  return areas;
}

export const IndexChartsSection: FC<IndexChartsSectionProps> = ({
  indexes,
}) => {
  const symbols = useMemo(() => indexes.map((idx) => idx.symbol), [indexes]);
  const {
    data: intradaySeries,
    isLoading,
    error,
  } = useIndexIntraday(symbols);

  const seriesMeta = useMemo(() => {
    const map = new Map<string, SeriesChartMeta>();

    intradaySeries?.forEach((series) => {
      const sessionStart = new Date(series.sessionStart).getTime();
      const regularStart = new Date(series.regularStart).getTime();
      const regularEnd = new Date(series.regularEnd).getTime();
      const sessionEnd = new Date(series.sessionEnd).getTime();

      const points: ChartPoint[] = series.points.map((point) => {
        const timestamp = new Date(point.timestamp).getTime();
        return {
          ts: timestamp,
          price: point.price,
          session: point.session,
          label: formatIsraelTooltip(timestamp),
        };
      });

      const ticks = generateHourlyTicks(
        series.sessionStart,
        series.sessionEnd
      );

      map.set(series.symbol, {
        points,
        sessionStart,
        regularStart,
        regularEnd,
        sessionEnd,
        ticks,
      });
    });

    return map;
  }, [intradaySeries]);

  return (
    <GlassCard className="p-6">
      <div className="flex flex-col gap-2 mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Intraday Performance (Israel Time)
        </h2>
        <p className="text-sm text-muted-foreground">
          Live chart from pre-market (yellow) through after-hours (blue). Updates
          every ~4 seconds while markets are open.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 mb-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">
            Failed to load intraday charts:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </span>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-3 text-sm text-muted-foreground">
            Fetching live charts...
          </span>
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {indexes.map((index) => {
            const meta = seriesMeta.get(index.symbol);
            const chartData = meta?.points ?? [];
            const sessionAreas = meta ? buildSessionAreas(meta) : [];

            if (!meta || !chartData.length) {
              return (
                <div
                  key={index.symbol}
                  className="p-6 border border-dashed border-border/60 rounded-xl text-sm text-muted-foreground"
                >
                  No intraday data yet for {index.name}. Waiting for next market
                  update...
                </div>
              );
            }

            return (
              <div key={index.symbol}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">{index.name}</h3>
                  <span className="text-xs text-muted-foreground">
                    last update {chartData[chartData.length - 1]?.label}
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    {sessionAreas.map((area) => (
                      <ReferenceArea
                        key={`${index.symbol}-${area.session}`}
                        x1={area.x1}
                        x2={area.x2}
                        strokeOpacity={0}
                        fill={area.fill}
                        ifOverflow="extendDomain"
                      />
                    ))}
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.08)"
                    />
                    <XAxis
                      dataKey="ts"
                      type="number"
                      domain={[meta.sessionStart, meta.sessionEnd]}
                      ticks={meta.ticks.length ? meta.ticks : undefined}
                      tickFormatter={formatIsraelHour}
                      stroke="rgba(255,255,255,0.5)"
                      style={{ fontSize: "12px" }}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.5)"
                      style={{ fontSize: "12px" }}
                      width={60}
                      domain={["dataMin", "dataMax"]}
                      allowDecimals={false}
                      tickFormatter={(value) =>
                        Math.round(value).toLocaleString("en-US")
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(20, 20, 31, 0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [
                        `$${value.toFixed(2)}`,
                        "Price",
                      ]}
                      labelFormatter={(label) =>
                        `Israel Time • ${formatIsraelTooltip(label as number)}`
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
};

