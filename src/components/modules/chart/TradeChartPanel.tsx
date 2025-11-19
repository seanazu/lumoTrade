"use client";

import { useState, useMemo, type FC } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from "recharts";
import { GlassCard } from "@/components/design-system/organisms/GlassCard";
import { ChartControls } from "./ChartControls";
import { ChartTimeframe } from "@/types/chart";
import { TradePlan } from "@/types/trade";
import { fadeInScale } from "@/utils/animations/variants";
import { smoothTransition } from "@/utils/animations/transitions";

interface TradeChartPanelProps {
  ticker: string;
  tradePlan: TradePlan | null;
}

// Generate mock chart data
const generateChartData = (basePrice: number, days: number = 30) => {
  const data = [];
  let price = basePrice;
  
  for (let i = 0; i < days; i++) {
    const change = (Math.random() - 0.48) * (basePrice * 0.02);
    price = Math.max(price + change, basePrice * 0.9);
    
    data.push({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: parseFloat(price.toFixed(2)),
    });
  }
  
  return data;
};

const TradeChartPanel: FC<TradeChartPanelProps> = ({ ticker, tradePlan }) => {
  const [timeframe, setTimeframe] = useState<ChartTimeframe>("1M");
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);

  // Generate mock data based on trade plan
  const currentPrice = tradePlan ? (tradePlan.entry.min + tradePlan.entry.max) / 2 : 100;
  const chartData = useMemo(() => generateChartData(currentPrice, 30), [currentPrice]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInScale}
      transition={smoothTransition}
    >
      <GlassCard className="h-[500px]">
        <div className="flex flex-col h-full">
          <ChartControls
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            selectedIndicators={selectedIndicators}
            onIndicatorsChange={setSelectedIndicators}
          />

          <div className="flex-1 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="date"
                  stroke="rgba(255,255,255,0.5)"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.5)"
                  style={{ fontSize: '12px' }}
                  domain={['dataMin - 5', 'dataMax + 5']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0f1e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#9ca3af' }}
                />

                {/* Trade Plan Zones */}
                {tradePlan && (
                  <>
                    {/* Entry Zone */}
                    <ReferenceArea
                      y1={tradePlan.entry.min}
                      y2={tradePlan.entry.max}
                      fill="#00d9ff"
                      fillOpacity={0.1}
                      stroke="#00d9ff"
                      strokeDasharray="3 3"
                    />
                    
                    {/* Target Line */}
                    <ReferenceLine
                      y={tradePlan.target[0]}
                      stroke="#4ade80"
                      strokeDasharray="3 3"
                      label={{ value: `Target: $${tradePlan.target[0]}`, position: 'right', fill: '#4ade80' }}
                    />
                    
                    {/* Stop Line */}
                    <ReferenceLine
                      y={tradePlan.stop}
                      stroke="#f87171"
                      strokeDasharray="3 3"
                      label={{ value: `Stop: $${tradePlan.stop}`, position: 'right', fill: '#f87171' }}
                    />
                  </>
                )}

                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#00d9ff"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export { TradeChartPanel };

