"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/design-system/atoms/Card';
import { Button } from '@/components/design-system/atoms/Button';
import { DistributionChart } from '@/components/design-system/charts';
import { TrendingUp, TrendingDown, Minus, Target, AlertTriangle, Brain } from 'lucide-react';
import { useSSEProgress } from '@/hooks/useSSEProgress';
import { ProgressPanel } from '@/components/modules/progress/ProgressPanel';

interface TomorrowPredictionProps {
  index: string;
}

export function TomorrowPrediction({ index }: TomorrowPredictionProps) {
  const [operationId, setOperationId] = useState<string | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  
  // SSE Progress tracking
  const sseUrl = operationId
    ? `http://localhost:8000/api/stream/prediction?operation_id=${operationId}&index=${index}&horizons=1d&debug=true`
    : null;
  const { progress, isConnected, connect, disconnect } = useSSEProgress(sseUrl);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['tomorrow-prediction', index],
    queryFn: async () => {
      const response = await fetch('http://localhost:8000/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          index,
          horizons: ['1d'],
          debug: true
        })
      });
      
      if (!response.ok) throw new Error('Failed to fetch prediction');
      return response.json();
    },
    enabled: false,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const handleGeneratePrediction = () => {
    // Generate unique operation ID
    const newOpId = `pred_${Date.now()}`;
    setOperationId(newOpId);
    setShowProgress(true);
    
    // Start SSE connection
    setTimeout(() => connect(), 100);
  };

  // Use result from SSE if available, otherwise fallback to query data
  const predictionData = progress.result?.data || data?.data;

  const prediction = predictionData?.horizons?.['1d'];
  const keyFactors = predictionData?.key_factors || [];

  const direction = prediction?.direction || 'neutral';
  const confidence = prediction?.confidence || 0;
  const expectedMove = prediction?.expected_move_percent || 0;
  const p10 = prediction?.p10 || (expectedMove - 1);
  const p90 = prediction?.p90 || (expectedMove + 1);

  const DirectionIcon = direction === 'bullish' ? TrendingUp : direction === 'bearish' ? TrendingDown : Minus;
  const directionColor = direction === 'bullish' ? 'text-green-400' : direction === 'bearish' ? 'text-red-400' : 'text-gray-400';
  const directionBg = direction === 'bullish' ? 'bg-green-500/20' : direction === 'bearish' ? 'bg-red-500/20' : 'bg-gray-500/20';
  const directionBorder = direction === 'bullish' ? 'border-green-500/30' : direction === 'bearish' ? 'border-red-500/30' : 'border-gray-500/30';

  return (
    <Card className={`p-8 bg-gradient-to-br from-gray-900 via-gray-900/95 to-gray-800/50 border-2 ${directionBorder}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Target className="w-6 h-6 text-blue-400" />
          Tomorrow's Prediction
        </h2>
        <Button
          onClick={handleGeneratePrediction}
          disabled={isFetching || isConnected}
          size="sm"
          className="gap-2"
        >
          {isConnected ? (
            <>
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Generating...
            </>
          ) : (
            'Generate New Prediction'
          )}
        </Button>
      </div>

      {/* Progress Panel */}
      {showProgress && progress.steps.length > 0 && (
        <div className="mb-6">
          <ProgressPanel 
            progress={progress} 
            title="Prediction Progress"
            showData={true}
          />
        </div>
      )}

      {isLoading || isFetching || isConnected ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-400">
            {isConnected ? 'Generating prediction...' : 'Analyzing market conditions...'}
          </p>
        </div>
      ) : (progress.isComplete || data?.success) && prediction ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Direction & Confidence */}
          <div className="space-y-6">
            {/* Direction Indicator */}
            <div className={`${directionBg} border ${directionBorder} rounded-2xl p-8 text-center`}>
              <DirectionIcon className={`w-24 h-24 ${directionColor} mx-auto mb-4`} />
              <h3 className={`text-4xl font-bold ${directionColor} uppercase tracking-wide`}>
                {direction}
              </h3>
              <p className="text-gray-400 text-sm mt-2">Market Direction</p>
            </div>

            {/* Confidence Meter */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400 text-sm font-medium">Confidence Level</span>
                <span className="text-white text-2xl font-bold">{(confidence * 100).toFixed(0)}%</span>
              </div>
              
              {/* Circular Progress */}
              <div className="relative w-32 h-32 mx-auto">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#374151"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke={direction === 'bullish' ? '#10b981' : direction === 'bearish' ? '#ef4444' : '#6b7280'}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - confidence)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-3xl font-bold ${directionColor}`}>
                    {(confidence * 100).toFixed(0)}
                  </span>
                </div>
              </div>
              
              {confidence < 0.6 && (
                <div className="mt-4 flex items-start gap-2 text-amber-400 text-xs bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>Low confidence. Consider waiting for stronger signals before trading.</p>
                </div>
              )}
            </div>

            {/* Model Source Badge */}
            {prediction?.source && (
              <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-300 text-sm font-medium">Prediction Source</span>
                  <div className="flex items-center gap-2">
                    {prediction.model_details?.lightgbm && (
                      <div className="flex items-center gap-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full px-3 py-1">
                        <Brain className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs font-semibold text-blue-300">LightGBM</span>
                      </div>
                    )}
                    {prediction.model_details?.llm && (
                      <div className="flex items-center gap-1.5 bg-purple-500/20 border border-purple-500/30 rounded-full px-3 py-1">
                        <Target className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-xs font-semibold text-purple-300">ChatGPT</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {prediction.model_details?.fusion_weights && (
                  <div className="space-y-2">
                    {prediction.model_details.fusion_weights.ml_weight > 0 && (
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-400">ML Weight</span>
                          <span className="text-blue-400 font-semibold">
                            {(prediction.model_details.fusion_weights.ml_weight * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                            style={{ width: `${prediction.model_details.fusion_weights.ml_weight * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {prediction.model_details.fusion_weights.llm_weight > 0 && (
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-400">LLM Weight</span>
                          <span className="text-purple-400 font-semibold">
                            {(prediction.model_details.fusion_weights.llm_weight * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-500"
                            style={{ width: `${prediction.model_details.fusion_weights.llm_weight * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Expected Move */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">Expected Move</p>
                <p className={`text-5xl font-bold ${directionColor}`}>
                  {expectedMove >= 0 ? '+' : ''}{expectedMove.toFixed(2)}%
                </p>
                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                  <div>
                    <p>P10 (Pessimistic)</p>
                    <p className="text-white font-semibold">{p10.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p>P90 (Optimistic)</p>
                    <p className="text-white font-semibold">{p90.toFixed(2)}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Distribution & Factors */}
          <div className="space-y-6">
            {/* Probability Distribution */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 h-80">
              <DistributionChart
                mean={expectedMove}
                p10={p10}
                p90={p90}
                color={direction === 'bullish' ? '#10b981' : direction === 'bearish' ? '#ef4444' : '#6b7280'}
                title="Move Probability Distribution"
              />
            </div>

            {/* Key Factors */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <h4 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">
                Key Factors Driving Prediction
              </h4>
              
              {keyFactors.length > 0 ? (
                <div className="space-y-3">
                  {keyFactors.slice(0, 5).map((factor: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{factor.feature || factor.name}</p>
                        {factor.importance && (
                          <div className="mt-1">
                            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full transition-all"
                                style={{ width: `${factor.importance * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {factor.description && (
                          <p className="text-gray-400 text-xs mt-1">{factor.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">No key factors available</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-4">No prediction available</p>
          <Button onClick={handleGeneratePrediction}>
            Generate Prediction for Tomorrow
          </Button>
        </div>
      )}
    </Card>
  );
}

