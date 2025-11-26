"use client"

import { Card } from "@/components/ui/card"
import { useTheme } from "@/hooks/useTheme"
import { BarChart, Bar, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Legend } from "recharts"

interface FeatureImportance {
  feature: string
  importance: number
  category?: string
  current_value?: number
  z_score?: number
}

interface FeatureImportancePanelProps {
  features: FeatureImportance[]
}

export function FeatureImportancePanel({ features }: FeatureImportancePanelProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  
  // Top 20 features
  const topFeatures = features.slice(0, 20)
  
  // Category breakdown
  const categoryData = features.reduce((acc, feat) => {
    const cat = feat.category || "Other"
    if (!acc[cat]) acc[cat] = 0
    acc[cat] += feat.importance
    return acc
  }, {} as Record<string, number>)
  
  const categoryChartData = Object.entries(categoryData).map(([name, value]) => ({
    name,
    value: Math.round(value * 100) / 100
  }))
  
  // Category colors
  const CATEGORY_COLORS: Record<string, string> = {
    "Technical": "#3b82f6",
    "News": "#10b981",
    "Macro": "#f59e0b",
    "Cross-Asset": "#8b5cf6",
    "Breadth": "#ec4899",
    "Calendar": "#6366f1",
    "Interactions": "#14b8a6",
    "Other": "#6b7280"
  }
  
  return (
    <div className="space-y-6">
      {/* Top 20 Features Bar Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top 20 Features</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={topFeatures}
            layout="vertical"
            margin={{ left: 150, right: 20, top: 5, bottom: 5 }}
          >
            <XAxis type="number" stroke={isDark ? "#9ca3af" : "#6b7280"} />
            <YAxis 
              type="category" 
              dataKey="feature" 
              stroke={isDark ? "#9ca3af" : "#6b7280"}
              width={140}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
              {topFeatures.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={CATEGORY_COLORS[entry.category || "Other"] || "#6b7280"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      
      {/* Category Breakdown Pie Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Feature Category Breakdown</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {categoryChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || "#6b7280"} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}',
                borderRadius: '8px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </Card>
      
      {/* Current Feature Values */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top 10 Feature Values</h3>
        <div className="space-y-2">
          {topFeatures.slice(0, 10).map((feat, idx) => {
            const isUnusual = feat.z_score && Math.abs(feat.z_score) > 2
            
            return (
              <div 
                key={idx} 
                className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'} ${isUnusual ? 'ring-2 ring-yellow-500' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{feat.feature}</div>
                    <div className="text-sm text-muted-foreground">
                      {feat.category || "Other"}
                    </div>
                  </div>
                  <div className="text-right">
                    {feat.current_value !== undefined && (
                      <div className="font-semibold">
                        {feat.current_value.toFixed(3)}
                      </div>
                    )}
                    {feat.z_score !== undefined && (
                      <div className={`text-sm ${isUnusual ? 'text-yellow-500 font-semibold' : 'text-muted-foreground'}`}>
                        Z: {feat.z_score.toFixed(2)}
                        {isUnusual && " ⚠️"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

