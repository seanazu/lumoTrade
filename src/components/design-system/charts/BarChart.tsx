"use client";

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface BarChartDataPoint {
  name: string;
  value: number;
  group?: string;
}

interface BarChartProps {
  data: BarChartDataPoint[];
  title?: string;
  horizontal?: boolean;
  colorByGroup?: boolean;
}

const GROUP_COLORS: Record<string, string> = {
  'news': '#3b82f6',
  'price': '#10b981',
  'macro': '#f59e0b',
  'technical': '#8b5cf6',
  'sentiment': '#ec4899',
  'default': '#6b7280'
};

export function BarChart({ 
  data, 
  title,
  horizontal = true,
  colorByGroup = false
}: BarChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold">{data.name}</p>
          <p className="text-gray-400 text-sm">
            Importance: {(data.value * 100).toFixed(1)}%
          </p>
          {data.group && <p className="text-gray-500 text-xs mt-1">{data.group}</p>}
        </div>
      );
    }
    return null;
  };

  const getColor = (entry: BarChartDataPoint, index: number) => {
    if (colorByGroup && entry.group) {
      return GROUP_COLORS[entry.group] || GROUP_COLORS.default;
    }
    return `hsl(${200 + index * 15}, 70%, 50%)`;
  };

  if (horizontal) {
    return (
      <div className="w-full h-full">
        {title && <h3 className="text-sm font-medium text-gray-400 mb-2">{title}</h3>}
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart 
            data={data} 
            layout="vertical"
            margin={{ top: 5, right: 20, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              type="number"
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            />
            <YAxis 
              type="category"
              dataKey="name"
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              width={95}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry, index)} />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {title && <h3 className="text-sm font-medium text-gray-400 mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="name" 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            angle={-45}
            textAnchor="end"
          />
          <YAxis 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry, index)} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

