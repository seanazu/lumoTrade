"use client"

import { Card } from "@/components/ui/card"
import { useTheme } from "@/hooks/useTheme"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, ComposedChart } from "recharts"

interface QuantilePrediction {
  horizon: string  // "1h", "5h", "20h"
  p10: number
  p50: number
  p90: number
  prob_up: number
}

interface QuantilePredictionChartProps {
  predictions: Record<string, QuantilePrediction>
}

export function QuantilePredictionChart({ predictions }: QuantilePredictionChartProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  
  // Prepare data for chart
  const chartData = Object.entries(predictions).map(([key, pred]) => ({
    horizon: pred.horizon,
    p10: pred.p10,
    p50: pred.p50,
    p90: pred.p90,
    spread: pred.p90 - pred.p10
  }))
  
  // Calculate confidence level based on spread
  const getConfidenceColor = (spread: number) => {
    if (spread < 1.0) return "text-green-500"
    if (spread < 2.0) return "text-yellow-500"
    return "text-red-500"
  }
  
  const getConfidenceLabel = (spread: number) => {
    if (spread < 1.0) return "High"
    if (spread < 2.0) return "Medium"
    return "Low"
  }
  
  return (
    <div className="space-y-4">
      {/* Quantile Range Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quantile Predictions (P10-P50-P90)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
            <XAxis 
              dataKey="horizon" 
              stroke={isDark ? "#9ca3af" : "#6b7280"}
            />
            <YAxis 
              stroke={isDark ? "#9ca3af" : "#6b7280"}
              label={{ value: 'Return %', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                borderRadius: '8px'
              }}
              formatter={(value: number) => `${value.toFixed(2)}%`}
            />
            
            {/* P10-P90 Range (shaded area) */}
            <Area
              type="monotone"
              dataKey="p90"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.2}
              name="P90 (Optimistic)"
            />
            <Area
              type="monotone"
              dataKey="p10"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.2}
              name="P10 (Pessimistic)"
            />
            
            {/* P50 Line (median) */}
            <Line
              type="monotone"
              dataKey="p50"
              stroke={isDark ? "#60a5fa" : "#3b82f6"}
              strokeWidth={3}
              dot={{ fill: isDark ? "#60a5fa" : "#3b82f6", r: 5 }}
              name="P50 (Median)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>
      
      {/* Confidence Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(predictions).map(([key, pred]) => {
          const spread = pred.p90 - pred.p10
          const confidence = getConfidenceLabel(spread)
          const confidenceColor = getConfidenceColor(spread)
          
          return (
            <Card key={key} className="p-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-2">{pred.horizon} Horizon</div>
                
                {/* Probability Gauge */}
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={isDark ? "#374151" : "#e5e7eb"}
                      strokeWidth="8"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={pred.prob_up > 0.5 ? "#10b981" : "#ef4444"}
                      strokeWidth="8"
                      strokeDasharray={`${pred.prob_up * 251.2} 251.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-2xl font-bold">
                      {(pred.prob_up * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {pred.prob_up > 0.5 ? "Bullish" : "Bearish"}
                    </div>
                  </div>
                </div>
                
                {/* Prediction Values */}
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">P10:</span>
                    <span className="text-red-500 font-medium">{pred.p10.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">P50:</span>
                    <span className={`font-semibold ${pred.p50 > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {pred.p50.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">P90:</span>
                    <span className="text-green-500 font-medium">{pred.p90.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Confidence:</span>
                    <span className={`font-semibold ${confidenceColor}`}>{confidence}</span>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

