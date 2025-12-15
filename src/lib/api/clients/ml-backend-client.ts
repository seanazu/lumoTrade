/**
 * ML Backend Client
 * Connects Next.js frontend to Python ML backend
 */

const ML_BACKEND_URL = process.env.NEXT_PUBLIC_ML_BACKEND_URL || "http://localhost:8000";

export interface MLPrediction {
  timestamp: string;
  predictions: {
    [symbol: string]: {
      direction: "bullish" | "bearish" | "neutral";
      confidence: number;
      expected_move: number;
      price_target: number;
    };
  };
  model_version: string;
  model_accuracy: number;
}

export interface BacktestConfig {
  start_date: string;
  end_date: string;
  initial_capital: number;
  strategy: {
    position_size?: number;
    min_confidence?: number;
    stop_loss?: number;
    take_profit?: number;
  };
}

export interface BacktestResult {
  equity_curve: Array<{
    timestamp: string;
    equity: number;
    cash: number;
    positions_value: number;
  }>;
  trades: Array<{
    entry_time: string;
    exit_time: string;
    direction: string;
    entry_price: number;
    exit_price: number;
    pnl: number;
    pnl_percent: number;
    confidence: number;
  }>;
  metrics: {
    total_return: number;
    total_return_pct: number;
    sharpe_ratio: number;
    max_drawdown: number;
    win_rate: number;
    num_trades: number;
    avg_win: number;
    avg_loss: number;
    profit_factor: number;
  };
}

export interface ModelAccuracy {
  accuracy_30d: number;
  direction_accuracy: number;
  magnitude_rmse: number;
  confidence_calibration: number;
  total_predictions: number;
}

class MLBackendClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = ML_BACKEND_URL;
  }

  /**
   * Health check for ML backend
   */
  async healthCheck(): Promise<{ status: string; timestamp: string; version: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("ML Backend health check failed:", error);
      throw error;
    }
  }

  /**
   * Get current market prediction
   */
  async getCurrentPrediction(): Promise<MLPrediction> {
    try {
      const response = await fetch(`${this.baseUrl}/predict/current`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch ML prediction:", error);
      throw error;
    }
  }

  /**
   * Run backtest with custom strategy
   */
  async runBacktest(config: BacktestConfig): Promise<BacktestResult> {
    try {
      const response = await fetch(`${this.baseUrl}/backtest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to run backtest:", error);
      throw error;
    }
  }

  /**
   * Get model accuracy metrics
   */
  async getModelAccuracy(): Promise<ModelAccuracy> {
    try {
      const response = await fetch(`${this.baseUrl}/performance/accuracy`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch model accuracy:", error);
      throw error;
    }
  }

  /**
   * Optimize strategy parameters
   */
  async optimizeStrategy(constraints: {
    min_sharpe?: number;
    max_drawdown?: number;
    min_win_rate?: number;
  }): Promise<{
    optimal_params: {
      min_confidence: number;
      position_size: number;
      stop_loss: number;
      take_profit: number;
    };
    expected_sharpe: number;
    expected_return: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/strategy/optimize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(constraints),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to optimize strategy:", error);
      throw error;
    }
  }
}

// Singleton instance
export const mlBackendClient = new MLBackendClient();

