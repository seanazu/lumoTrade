"use client";

import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DataSeries {
  name: string;
  dataKey: string;
  color: string;
}

interface LineChartProps {
  data: any[];
  series: DataSeries[];
  xAxisKey: string;
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  yAxisFormatter?: (value: number) => string;
}

export function LineChart({ 
  data, 
  series,
  xAxisKey,
  title,
  xAxisLabel,
  yAxisLabel,
  yAxisFormatter
}: LineChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-gray-400 text-xs mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <p className="text-white text-sm">
                <span className="text-gray-400">{entry.name}:</span>{' '}
                <span className="font-semibold">
                  {yAxisFormatter ? yAxisFormatter(entry.value) : entry.value.toFixed(2)}
                </span>
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full">
      {title && <h3 className="text-sm font-medium text-gray-400 mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey={xAxisKey}
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5, fill: '#9CA3AF' } : undefined}
          />
          <YAxis 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', fill: '#9CA3AF' } : undefined}
            tickFormatter={yAxisFormatter}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: '#9CA3AF' }} />
          {series.map((s, idx) => (
            <Line 
              key={idx}
              type="monotone" 
              dataKey={s.dataKey}
              name={s.name}
              stroke={s.color} 
              strokeWidth={2}
              dot={false}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

