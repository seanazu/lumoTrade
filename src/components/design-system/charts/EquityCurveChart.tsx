"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface EquityPoint {
  timestamp: string;
  equity: number;
}

interface EquityCurveChartProps {
  data: EquityPoint[];
  initialCapital: number;
  color?: string;
  title?: string;
}

export function EquityCurveChart({ 
  data, 
  initialCapital, 
  color = "#10b981",
  title = "Equity Curve"
}: EquityCurveChartProps) {
  // Format data for chart
  const chartData = data.map((point, idx) => ({
    index: idx,
    equity: point.equity,
    date: new Date(point.timestamp).toLocaleDateString()
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const pnl = data.equity - initialCapital;
      const pnlPercent = ((pnl / initialCapital) * 100).toFixed(2);
      
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-gray-400 text-xs mb-1">{data.date}</p>
          <p className="text-white font-semibold">
            ${data.equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className={`text-sm ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {pnl >= 0 ? '+' : ''}{pnlPercent}% ({pnl >= 0 ? '+' : ''}${pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
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
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="index" 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <YAxis 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: '#9CA3AF' }} />
          <Line 
            type="monotone" 
            dataKey="equity" 
            stroke={color} 
            strokeWidth={2}
            dot={false}
            name="Equity"
          />
          {/* Initial capital reference line */}
          <Line 
            type="monotone" 
            dataKey={() => initialCapital} 
            stroke="#6B7280" 
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            name="Initial Capital"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

