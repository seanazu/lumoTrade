"use client";

import { ScatterChart as RechartsScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ZAxis } from 'recharts';

interface ScatterPoint {
  predicted_move: number;
  actual_move: number;
  confidence?: number;
  horizon?: string;
  correct?: boolean;
}

interface ScatterChartProps {
  data: ScatterPoint[];
  title?: string;
  showPerfectLine?: boolean;
}

export function ScatterChart({ 
  data, 
  title = "Prediction vs Actual",
  showPerfectLine = true
}: ScatterChartProps) {
  // Add z-axis value for bubble sizing
  const chartData = data.map(point => ({
    ...point,
    z: (point.confidence || 0.5) * 100
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-gray-400 text-xs mb-1">
            {point.horizon ? `${point.horizon} horizon` : 'Prediction'}
          </p>
          <div className="space-y-1">
            <p className="text-white text-sm">
              Predicted: <span className="font-semibold">{point.predicted_move.toFixed(2)}%</span>
            </p>
            <p className="text-white text-sm">
              Actual: <span className="font-semibold">{point.actual_move.toFixed(2)}%</span>
            </p>
            {point.confidence && (
              <p className="text-gray-400 text-xs">
                Confidence: {(point.confidence * 100).toFixed(0)}%
              </p>
            )}
            <p className={`text-xs font-semibold ${point.correct ? 'text-green-400' : 'text-red-400'}`}>
              {point.correct ? '✓ Correct Direction' : '✗ Wrong Direction'}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate axis domain
  const allValues = [...data.map(d => d.predicted_move), ...data.map(d => d.actual_move)];
  const maxAbs = Math.max(...allValues.map(Math.abs));
  const domain = [-maxAbs * 1.1, maxAbs * 1.1];

  return (
    <div className="w-full h-full">
      {title && <h3 className="text-sm font-medium text-gray-400 mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height="100%">
        <RechartsScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            type="number"
            dataKey="predicted_move"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            label={{ value: 'Predicted Move (%)', position: 'insideBottom', offset: -10, fill: '#9CA3AF' }}
            domain={domain}
          />
          <YAxis 
            type="number"
            dataKey="actual_move"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            label={{ value: 'Actual Move (%)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
            domain={domain}
          />
          <ZAxis type="number" dataKey="z" range={[20, 200]} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          
          {/* Perfect prediction line (y=x) */}
          {showPerfectLine && (
            <ReferenceLine 
              segment={[{ x: domain[0], y: domain[0] }, { x: domain[1], y: domain[1] }]}
              stroke="#10b981" 
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          )}
          
          {/* Zero lines */}
          <ReferenceLine x={0} stroke="#6B7280" strokeWidth={1} />
          <ReferenceLine y={0} stroke="#6B7280" strokeWidth={1} />
          
          {/* Correct predictions (green) */}
          <Scatter 
            data={chartData.filter(d => d.correct)} 
            fill="#10b981"
            fillOpacity={0.6}
            stroke="#10b981"
          />
          
          {/* Incorrect predictions (red) */}
          <Scatter 
            data={chartData.filter(d => !d.correct)} 
            fill="#ef4444"
            fillOpacity={0.6}
            stroke="#ef4444"
          />
        </RechartsScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

