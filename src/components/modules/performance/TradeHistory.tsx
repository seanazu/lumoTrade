"use client";

import { type FC } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/design-system/atoms/Badge";

interface Trade {
  id: string;
  symbol: string;
  type: 'long' | 'short';
  entry: number;
  exit: number;
  shares: number;
  profitLoss: number;
  profitLossPercent: number;
  date: string;
}

interface TradeHistoryProps {
  trades: Trade[];
}

export const TradeHistory: FC<TradeHistoryProps> = ({ trades }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="text-left border-b border-border">
          <tr>
            <th className="pb-3 text-sm font-semibold text-muted-foreground">Symbol</th>
            <th className="pb-3 text-sm font-semibold text-muted-foreground">Type</th>
            <th className="pb-3 text-sm font-semibold text-muted-foreground">Entry</th>
            <th className="pb-3 text-sm font-semibold text-muted-foreground">Exit</th>
            <th className="pb-3 text-sm font-semibold text-muted-foreground">Shares</th>
            <th className="pb-3 text-sm font-semibold text-muted-foreground">P&L</th>
            <th className="pb-3 text-sm font-semibold text-muted-foreground">Date</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade, idx) => (
            <motion.tr
              key={trade.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="border-b border-border/50 hover:bg-secondary/50"
            >
              <td className="py-3 font-semibold">{trade.symbol}</td>
              <td className="py-3">
                <Badge variant={trade.type === 'long' ? 'bullish' : 'bearish'}>
                  {trade.type}
                </Badge>
              </td>
              <td className="py-3 tabular-nums">${trade.entry.toFixed(2)}</td>
              <td className="py-3 tabular-nums">${trade.exit.toFixed(2)}</td>
              <td className="py-3 tabular-nums">{trade.shares}</td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  {trade.profitLoss >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span
                    className={`font-semibold tabular-nums ${
                      trade.profitLoss >= 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    ${trade.profitLoss.toFixed(2)} ({trade.profitLoss >= 0 ? "+" : ""}
                    {trade.profitLossPercent.toFixed(1)}%)
                  </span>
                </div>
              </td>
              <td className="py-3 text-sm text-muted-foreground">{trade.date}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

