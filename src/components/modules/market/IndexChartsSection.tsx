"use client";

import { type FC } from "react";
import { BarChart3 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { GlassCard } from "@/components/design-system/organisms/GlassCard";
import { IndexData } from "@/resources/mock-data/indexes";

interface IndexChartsSectionProps {
  indexes: IndexData[];
}

// Generate mock chart data for indexes
const generateIndexChart = (basePrice: number) => {
  const data = [];
  let price = basePrice * 0.98;
  for (let i = 0; i < 30; i++) {
    const change = (Math.random() - 0.48) * (basePrice * 0.005);
    price = price + change;
    data.push({
      time: `${i}h`,
      price: parseFloat(price.toFixed(2)),
    });
  }
  return data;
};

export const IndexChartsSection: FC<IndexChartsSectionProps> = ({
  indexes,
}) => {
  return (
    <GlassCard className="p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <BarChart3 className="h-6 w-6" />
        Index Performance (30 Days)
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {indexes.map((index) => {
          const chartData = generateIndexChart(index.price);
          return (
            <div key={index.symbol}>
              <h3 className="text-sm font-semibold mb-3">{index.name}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis
                    dataKey="time"
                    stroke="rgba(255,255,255,0.5)"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.5)"
                    style={{ fontSize: "12px" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(20, 20, 31, 0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};

