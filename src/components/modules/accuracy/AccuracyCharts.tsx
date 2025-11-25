"use client";

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/design-system/atoms/Card';
import { LineChart, ScatterChart } from '@/components/design-system/charts';
import { TrendingUp, Target, CheckCircle2, Activity, BarChart3, TrendingDown, Calendar } from 'lucide-react';

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
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
        <p className="text-muted-foreground text-lg">Loading accuracy analytics...</p>
      </div>
    );
  }

  if (!history || !history.success) {
    return (
      <Card className="p-16 text-center bg-card border-border border-dashed">
        <BarChart3 className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
        <p className="text-muted-foreground text-lg font-medium">No accuracy data available</p>
        <p className="text-muted-foreground text-sm mt-2">Start making predictions to see analytics</p>
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

  // Calculate overall accuracy
  const overallAccuracy = timeSeriesData.length > 0
    ? (timeSeriesData.reduce((sum: number, d: any) => sum + d.accuracy, 0) / timeSeriesData.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-500/5 to-blue-500/10 dark:from-blue-500/10 dark:to-blue-500/5 border-blue-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-blue-500/20 rounded-lg">
              <Target className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Total Predictions</span>
          </div>
          <p className="text-4xl font-bold text-foreground">{history.total_predictions || 0}</p>
          <p className="text-xs text-muted-foreground mt-2">Across all horizons</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-500/5 to-green-500/10 dark:from-green-500/10 dark:to-green-500/5 border-green-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-green-500/20 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Overall Accuracy</span>
          </div>
          <p className="text-4xl font-bold text-foreground">{overallAccuracy}%</p>
          <p className="text-xs text-muted-foreground mt-2">
            {Number(overallAccuracy) >= 60 ? 'Excellent performance' : Number(overallAccuracy) >= 50 ? 'Good performance' : 'Needs improvement'}
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-500/5 to-purple-500/10 dark:from-purple-500/10 dark:to-purple-500/5 border-purple-500/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-purple-500/20 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-500" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Analysis Period</span>
          </div>
          <p className="text-4xl font-bold text-foreground">{days}</p>
          <p className="text-xs text-muted-foreground mt-2">days of history</p>
        </Card>
      </div>

      {/* Historical Accuracy Trend */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Accuracy Trend Over Time</h3>
            <p className="text-sm text-muted-foreground">Track prediction accuracy across the period</p>
          </div>
        </div>
        {timeSeriesData.length > 0 ? (
          <div className="h-80 bg-background/50 rounded-lg p-4 border border-border">
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
          <div className="text-center py-12 bg-secondary/30 rounded-lg border border-dashed border-border">
            <Activity className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No time series data available</p>
          </div>
        )}
      </Card>

      {/* Accuracy by Horizon */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Accuracy by Horizon</h3>
            <p className="text-sm text-muted-foreground">Performance across different time horizons</p>
          </div>
        </div>
        {horizonData.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {horizonData.map((item) => {
              const colorClass = item.accuracy >= 60 
                ? 'border-green-500/40 bg-green-500/10 dark:bg-green-500/20' 
                : item.accuracy >= 50 
                ? 'border-yellow-500/40 bg-yellow-500/10 dark:bg-yellow-500/20'
                : 'border-red-500/40 bg-red-500/10 dark:bg-red-500/20';
              
              const textColor = item.accuracy >= 60 
                ? 'text-green-600 dark:text-green-400' 
                : item.accuracy >= 50 
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-red-600 dark:text-red-400';
              
              return (
                <div key={item.horizon} className={`p-4 rounded-lg border ${colorClass} transition-all hover:shadow-lg`}>
                  <p className="text-muted-foreground text-xs font-medium mb-2">{item.horizon}</p>
                  <p className={`text-2xl font-bold ${textColor}`}>{item.accuracy.toFixed(1)}%</p>
                  <p className="text-muted-foreground text-xs mt-2">{item.total} predictions</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-secondary/30 rounded-lg border border-dashed border-border">
            <Target className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No horizon data available</p>
          </div>
        )}
      </Card>

      {/* Confidence Calibration */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Confidence Calibration</h3>
            <p className="text-sm text-muted-foreground">
          Are confidence scores accurate? (Expected vs Actual Accuracy)
        </p>
          </div>
        </div>
        {calibrationData.length > 0 ? (
          <div className="h-80 bg-background/50 rounded-lg p-4 border border-border">
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
          <div className="text-center py-12 bg-secondary/30 rounded-lg border border-dashed border-border">
            <TrendingUp className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No calibration data available</p>
          </div>
        )}
      </Card>

      {/* Prediction vs Actual Scatter */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Prediction vs Actual Moves</h3>
            <p className="text-sm text-muted-foreground">
          Green dots = correct direction, Red dots = wrong direction. 
          Diagonal line = perfect prediction.
        </p>
          </div>
        </div>
        {scatterData.length > 0 ? (
          <div className="h-96 bg-background/50 rounded-lg p-4 border border-border">
            <ScatterChart
              data={scatterData}
              title=""
              showPerfectLine={true}
            />
          </div>
        ) : (
          <div className="text-center py-12 bg-secondary/30 rounded-lg border border-dashed border-border">
            <BarChart3 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No prediction data available</p>
          </div>
        )}
      </Card>

      {/* Error Analysis */}
      {scatterData.length > 0 && (
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Error Analysis</h3>
              <p className="text-sm text-muted-foreground">Statistical performance metrics</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 bg-secondary/50 rounded-lg border border-border hover:shadow-lg transition-all">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-amber-500" />
                <p className="text-sm font-medium text-muted-foreground">Mean Absolute Error</p>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {(scatterData.reduce((sum: number, d: any) => 
                  sum + Math.abs(d.predicted_move - d.actual_move), 0) / scatterData.length
                ).toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground mt-2">Average prediction error</p>
            </div>
            
            <div className="p-6 bg-secondary/50 rounded-lg border border-border hover:shadow-lg transition-all">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <p className="text-sm font-medium text-muted-foreground">Directional Accuracy</p>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {((scatterData.filter((d: any) => d.correct).length / scatterData.length) * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-2">Correct direction predictions</p>
            </div>
            
            <div className="p-6 bg-secondary/50 rounded-lg border border-border hover:shadow-lg transition-all">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <p className="text-sm font-medium text-muted-foreground">Correlation</p>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {calculateCorrelation(scatterData).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">Prediction vs actual correlation</p>
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
