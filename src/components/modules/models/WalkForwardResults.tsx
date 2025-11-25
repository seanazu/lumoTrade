"use client"

import { Card } from "@/components/ui/card"
import { useTheme } from "@/hooks/useTheme"
import { LineChart, Line, ScatterChart, Scatter, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts"

interface FoldMetrics {
  fold: number
  train_start: string
  train_end: string
  test_start: string
  test_end: string
  train_samples: number
  test_samples: number
  metrics: {
    [key: string]: {
      mae: number
      coverage: number
      dir_acc: number
    }
  }
}

interface WalkForwardResultsProps {
  folds: FoldMetrics[]
  horizons: number[]
}

export function WalkForwardResults({ folds, horizons }: WalkForwardResultsProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  
  // Prepare metrics by fold for stability chart
  const stabilityData = folds.map(fold => {
    const result: any = {
      fold: fold.fold,
      train_end: new Date(fold.train_end).toLocaleDateString()
    }
    
    horizons.forEach(h => {
      const hKey = `h${h}`
      if (fold.metrics[hKey]) {
        result[`mae_${h}h`] = fold.metrics[hKey].mae
        result[`coverage_${h}h`] = fold.metrics[hKey].coverage * 100
        result[`dir_acc_${h}h`] = fold.metrics[hKey].dir_acc * 100
      }
    })
    
    return result
  })
  
  // Calculate average metrics
  const avgMetrics = horizons.map(h => {
    const hKey = `h${h}`
    const values = folds
      .filter(f => f.metrics[hKey])
      .map(f => f.metrics[hKey])
    
    return {
      horizon: `${h}h`,
      mae: values.reduce((sum, v) => sum + v.mae, 0) / values.length,
      coverage: (values.reduce((sum, v) => sum + v.coverage, 0) / values.length) * 100,
      dir_acc: (values.reduce((sum, v) => sum + v.dir_acc, 0) / values.length) * 100
    }
  })
  
  return (
    <div className="space-y-6">
      {/* Fold Timeline */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Walk-Forward Fold Timeline</h3>
        <div className="space-y-2">
          {folds.map((fold, idx) => (
            <div key={idx} className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">Fold {fold.fold}</div>
                  <div className="text-sm text-muted-foreground">
                    Train: {new Date(fold.train_start).toLocaleDateString()} → {new Date(fold.train_end).toLocaleDateString()}
                    {" | "}
                    Test: {new Date(fold.test_start).toLocaleDateString()} → {new Date(fold.test_end).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Train:</span> {fold.train_samples.toLocaleString()}
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Test:</span> {fold.test_samples.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Average Metrics Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Average Metrics by Horizon</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {avgMetrics.map((metric, idx) => (
            <div key={idx} className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">{metric.horizon}</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">MAE:</span>
                    <span className="font-medium">{metric.mae.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Coverage:</span>
                    <span className="font-medium text-green-500">{metric.coverage.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Dir Accuracy:</span>
                    <span className="font-medium text-blue-500">{metric.dir_acc.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      
      {/* Stability Chart - MAE over time */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Model Stability - MAE by Fold</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stabilityData}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
            <XAxis 
              dataKey="train_end" 
              stroke={isDark ? "#9ca3af" : "#6b7280"}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke={isDark ? "#9ca3af" : "#6b7280"}
              label={{ value: 'MAE', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                borderRadius: '8px'
              }}
            />
            <Legend />
            {horizons.map((h, idx) => (
              <Line
                key={h}
                type="monotone"
                dataKey={`mae_${h}h`}
                stroke={['#3b82f6', '#10b981', '#f59e0b'][idx % 3]}
                strokeWidth={2}
                dot={{ r: 4 }}
                name={`${h}h MAE`}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>
      
      {/* Stability Chart - Coverage over time */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Model Stability - Coverage by Fold</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stabilityData}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
            <XAxis 
              dataKey="train_end" 
              stroke={isDark ? "#9ca3af" : "#6b7280"}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke={isDark ? "#9ca3af" : "#6b7280"}
              domain={[0, 100]}
              label={{ value: 'Coverage %', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                borderRadius: '8px'
              }}
              formatter={(value: number) => `${value.toFixed(1)}%`}
            />
            <Legend />
            {horizons.map((h, idx) => (
              <Line
                key={h}
                type="monotone"
                dataKey={`coverage_${h}h`}
                stroke={['#10b981', '#3b82f6', '#8b5cf6'][idx % 3]}
                strokeWidth={2}
                dot={{ r: 4 }}
                name={`${h}h Coverage`}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>
      
      {/* Direction Accuracy over time */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Model Stability - Direction Accuracy by Fold</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stabilityData}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
            <XAxis 
              dataKey="train_end" 
              stroke={isDark ? "#9ca3af" : "#6b7280"}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke={isDark ? "#9ca3af" : "#6b7280"}
              domain={[0, 100]}
              label={{ value: 'Direction Accuracy %', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                borderRadius: '8px'
              }}
              formatter={(value: number) => `${value.toFixed(1)}%`}
            />
            <Legend />
            {horizons.map((h, idx) => (
              <Line
                key={h}
                type="monotone"
                dataKey={`dir_acc_${h}h`}
                stroke={['#f59e0b', '#ec4899', '#14b8a6'][idx % 3]}
                strokeWidth={2}
                dot={{ r: 4 }}
                name={`${h}h Direction`}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}

