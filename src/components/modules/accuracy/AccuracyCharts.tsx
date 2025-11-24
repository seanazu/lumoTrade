"use client";

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/design-system/atoms/Card';
import { LineChart, ScatterChart } from '@/components/design-system/charts';
import { TrendingUp, Target, CheckCircle2 } from 'lucide-react';

interface AccuracyChartsProps {
  days?: number;
}

export function AccuracyCharts({ days = 30 }: AccuracyChartsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['accuracy-history', days],
    queryFn: async () => {
      const response = await fetch(`http://localhost:8000/api/accuracy/history?days=${days}`);
      if (!response.ok) throw new Error('Failed to fetch accuracy history');
      return response.json();
    },
    refetchInterval: 60000 // Refetch every minute
  });

  const history = data?.data;

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="text-gray-400 mt-4">Loading accuracy data...</p>
      </div>
    );
  }

  if (!history || !history.success) {
    return (
      <Card className="p-12 text-center bg-gray-900/50 border-gray-800">
        <p className="text-gray-400">No accuracy data available</p>
      </Card>
    );
  }

  // Prepare data for historical accuracy line chart
  const timeSeriesData = history.time_series || [];
  
  // Prepare data for horizon comparison
  const horizonData = Object.entries(history.by_horizon || {}).map(([horizon, data]: [string, any]) => ({
    horizon,
    accuracy: data.accuracy,
    total: data.total
  }));

  // Prepare data for calibration chart
  const calibrationData = Object.entries(history.confidence_calibration || {}).map(([bucket, data]: [string, any]) => ({
    bucket,
    expected: data.expected_accuracy,
    actual: data.actual_accuracy,
    count: data.count
  }));

  // Prepare data for prediction vs actual scatter
  const scatterData = history.prediction_vs_actual || [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gray-900/50 border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Target className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm text-gray-400">Total Predictions</span>
          </div>
          <p className="text-3xl font-bold text-white">{history.total_predictions || 0}</p>
        </Card>

        <Card className="p-6 bg-gray-900/50 border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-sm text-gray-400">Overall Accuracy</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {timeSeriesData.length > 0
              ? (timeSeriesData.reduce((sum: number, d: any) => sum + d.accuracy, 0) / timeSeriesData.length).toFixed(1)
              : 0}%
          </p>
        </Card>

        <Card className="p-6 bg-gray-900/50 border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-sm text-gray-400">Period</span>
          </div>
          <p className="text-3xl font-bold text-white">{days} days</p>
        </Card>
      </div>

      {/* Historical Accuracy Trend */}
      <Card className="p-6 bg-gray-900/50 border-gray-800">
        <h3 className="text-lg font-bold text-white mb-4">Accuracy Trend Over Time</h3>
        {timeSeriesData.length > 0 ? (
          <div className="h-80">
            <LineChart
              data={timeSeriesData}
              xAxisKey="date"
              series={[
                { name: 'Accuracy', dataKey: 'accuracy', color: '#10b981' }
              ]}
              yAxisFormatter={(value) => `${value.toFixed(0)}%`}
              xAxisLabel="Date"
              yAxisLabel="Accuracy (%)"
            />
          </div>
        ) : (
          <p className="text-gray-500 text-center py-12">No time series data available</p>
        )}
      </Card>

      {/* Accuracy by Horizon */}
      <Card className="p-6 bg-gray-900/50 border-gray-800">
        <h3 className="text-lg font-bold text-white mb-4">Accuracy by Horizon</h3>
        {horizonData.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {horizonData.map((item) => {
              const colorClass = item.accuracy >= 60 
                ? 'border-green-500/30 bg-green-500/10' 
                : item.accuracy >= 50 
                ? 'border-yellow-500/30 bg-yellow-500/10'
                : 'border-red-500/30 bg-red-500/10';
              
              return (
                <div key={item.horizon} className={`p-4 rounded-lg border ${colorClass}`}>
                  <p className="text-gray-400 text-xs mb-1">{item.horizon}</p>
                  <p className="text-2xl font-bold text-white">{item.accuracy.toFixed(1)}%</p>
                  <p className="text-gray-500 text-xs mt-1">{item.total} predictions</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-12">No horizon data available</p>
        )}
      </Card>

      {/* Confidence Calibration */}
      <Card className="p-6 bg-gray-900/50 border-gray-800">
        <h3 className="text-lg font-bold text-white mb-4">Confidence Calibration</h3>
        <p className="text-sm text-gray-400 mb-4">
          Are confidence scores accurate? (Expected vs Actual Accuracy)
        </p>
        {calibrationData.length > 0 ? (
          <div className="h-80">
            <LineChart
              data={calibrationData}
              xAxisKey="bucket"
              series={[
                { name: 'Expected Accuracy', dataKey: 'expected', color: '#6b7280' },
                { name: 'Actual Accuracy', dataKey: 'actual', color: '#3b82f6' }
              ]}
              yAxisFormatter={(value) => `${value.toFixed(0)}%`}
              xAxisLabel="Confidence Range"
              yAxisLabel="Accuracy (%)"
            />
          </div>
        ) : (
          <p className="text-gray-500 text-center py-12">No calibration data available</p>
        )}
      </Card>

      {/* Prediction vs Actual Scatter */}
      <Card className="p-6 bg-gray-900/50 border-gray-800">
        <h3 className="text-lg font-bold text-white mb-4">Prediction vs Actual Moves</h3>
        <p className="text-sm text-gray-400 mb-4">
          Green dots = correct direction, Red dots = wrong direction. 
          Diagonal line = perfect prediction.
        </p>
        {scatterData.length > 0 ? (
          <div className="h-96">
            <ScatterChart
              data={scatterData}
              title=""
              showPerfectLine={true}
            />
          </div>
        ) : (
          <p className="text-gray-500 text-center py-12">No prediction data available</p>
        )}
      </Card>

      {/* Error Analysis */}
      {scatterData.length > 0 && (
        <Card className="p-6 bg-gray-900/50 border-gray-800">
          <h3 className="text-lg font-bold text-white mb-4">Error Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Mean Absolute Error</p>
              <p className="text-2xl font-bold text-white">
                {(scatterData.reduce((sum: number, d: any) => 
                  sum + Math.abs(d.predicted_move - d.actual_move), 0) / scatterData.length
                ).toFixed(2)}%
              </p>
            </div>
            
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Directional Accuracy</p>
              <p className="text-2xl font-bold text-white">
                {((scatterData.filter((d: any) => d.correct).length / scatterData.length) * 100).toFixed(1)}%
              </p>
            </div>
            
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Correlation</p>
              <p className="text-2xl font-bold text-white">
                {calculateCorrelation(scatterData).toFixed(2)}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// Helper function to calculate correlation coefficient
function calculateCorrelation(data: any[]): number {
  if (data.length === 0) return 0;
  
  const n = data.length;
  const sumX = data.reduce((sum, d) => sum + d.predicted_move, 0);
  const sumY = data.reduce((sum, d) => sum + d.actual_move, 0);
  const sumXY = data.reduce((sum, d) => sum + d.predicted_move * d.actual_move, 0);
  const sumX2 = data.reduce((sum, d) => sum + d.predicted_move ** 2, 0);
  const sumY2 = data.reduce((sum, d) => sum + d.actual_move ** 2, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2));
  
  return denominator === 0 ? 0 : numerator / denominator;
}

