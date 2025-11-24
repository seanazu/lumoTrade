"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface DistributionChartProps {
  mean: number;
  p10: number;  // 10th percentile
  p90: number;  // 90th percentile
  color?: string;
  title?: string;
}

export function DistributionChart({ 
  mean, 
  p10, 
  p90, 
  color = "#3b82f6",
  title = "Probability Distribution"
}: DistributionChartProps) {
  // Generate normal distribution curve
  const generateDistribution = () => {
    const points = [];
    const numPoints = 50;
    const range = p90 - p10;
    const std = range / 2.56; // approximate std from 80% confidence interval
    
    for (let i = 0; i < numPoints; i++) {
      const x = p10 + (range * i / (numPoints - 1));
      const z = (x - mean) / std;
      const y = Math.exp(-0.5 * z * z) / (std * Math.sqrt(2 * Math.PI));
      
      points.push({
        value: x,
        probability: y
      });
    }
    
    return points;
  };

  const data = generateDistribution();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].payload.value;
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold">
            {value >= 0 ? '+' : ''}{value.toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full">
      {title && <h3 className="text-sm font-medium text-gray-400 mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="value" 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            tickFormatter={(value) => `${value.toFixed(1)}%`}
          />
          <YAxis 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            hide
          />
          <Tooltip content={<CustomTooltip />} />
          <defs>
            <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <Area 
            type="monotone" 
            dataKey="probability" 
            stroke={color} 
            strokeWidth={2}
            fill="url(#colorProb)"
          />
          <ReferenceLine 
            x={mean} 
            stroke="#10b981" 
            strokeWidth={2}
            label={{ value: 'Mean', fill: '#10b981', position: 'top' }}
          />
          <ReferenceLine 
            x={p10} 
            stroke="#ef4444" 
            strokeWidth={1}
            strokeDasharray="3 3"
            label={{ value: 'P10', fill: '#ef4444', position: 'top' }}
          />
          <ReferenceLine 
            x={p90} 
            stroke="#ef4444" 
            strokeWidth={1}
            strokeDasharray="3 3"
            label={{ value: 'P90', fill: '#ef4444', position: 'top' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

