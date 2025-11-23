/**
 * React Query hook for ML predictions
 * Fetches real-time predictions from Python ML backend
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { mlBackendClient, type MLPrediction, type BacktestConfig, type BacktestResult, type ModelAccuracy } from "@/lib/api/clients/ml-backend-client";

/**
 * Hook to fetch current ML prediction
 * Updates every 60 seconds (predictions are generated every minute)
 */
export function useMLPrediction() {
  return useQuery<MLPrediction>({
    queryKey: ["ml-prediction"],
    queryFn: () => mlBackendClient.getCurrentPrediction(),
    refetchInterval: 60000, // Refetch every 60 seconds
    staleTime: 50000, // Consider data stale after 50 seconds
    retry: 2,
  });
}

/**
 * Hook to fetch model accuracy metrics
 */
export function useModelAccuracy() {
  return useQuery<ModelAccuracy>({
    queryKey: ["model-accuracy"],
    queryFn: () => mlBackendClient.getModelAccuracy(),
    refetchInterval: 300000, // Refetch every 5 minutes
    staleTime: 240000,
  });
}

/**
 * Hook to run backtests
 */
export function useBacktest() {
  return useMutation<BacktestResult, Error, BacktestConfig>({
    mutationFn: (config: BacktestConfig) => mlBackendClient.runBacktest(config),
  });
}

/**
 * Hook to optimize strategy parameters
 */
export function useStrategyOptimization() {
  return useMutation({
    mutationFn: (constraints: { min_sharpe?: number; max_drawdown?: number; min_win_rate?: number }) =>
      mlBackendClient.optimizeStrategy(constraints),
  });
}

/**
 * Hook to check ML backend health
 */
export function useMLBackendHealth() {
  return useQuery({
    queryKey: ["ml-backend-health"],
    queryFn: () => mlBackendClient.healthCheck(),
    refetchInterval: 120000, // Check every 2 minutes
    retry: 3,
  });
}

