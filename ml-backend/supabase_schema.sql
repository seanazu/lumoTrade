-- Supabase Schema for LumoTrade ML Backend
-- Run this in the Supabase SQL Editor

-- ============================================
-- Training Sessions Table
-- ============================================
CREATE TABLE IF NOT EXISTS training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_type VARCHAR(50) NOT NULL,  -- 'production', 'initial', 'incremental'
    index VARCHAR(10) NOT NULL,          -- 'QQQ', 'SPY', etc.
    lookback_days INTEGER,
    samples INTEGER,
    annual_return FLOAT,
    sharpe_ratio FLOAT,
    max_drawdown FLOAT,
    win_rate FLOAT,
    total_trades INTEGER,
    avg_profit_per_trade FLOAT,
    direction_accuracy FLOAT,
    metrics_json JSONB,                  -- Full metrics as JSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying recent sessions
CREATE INDEX IF NOT EXISTS idx_training_sessions_created 
ON training_sessions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_training_sessions_index 
ON training_sessions(index);

-- ============================================
-- Predictions Table
-- ============================================
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_id VARCHAR(100) UNIQUE,
    symbol VARCHAR(10) NOT NULL,
    horizon VARCHAR(10) NOT NULL,        -- '1h', '4h', '1d'
    predicted_direction VARCHAR(10),     -- 'up', 'down'
    predicted_return FLOAT,
    confidence FLOAT,
    timestamp TIMESTAMP WITH TIME ZONE,
    actual_return FLOAT,                 -- Filled after market close
    was_correct BOOLEAN,                 -- Filled after market close
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying predictions
CREATE INDEX IF NOT EXISTS idx_predictions_symbol 
ON predictions(symbol);

CREATE INDEX IF NOT EXISTS idx_predictions_timestamp 
ON predictions(timestamp DESC);

-- ============================================
-- Daily Predictions Table (for frontend)
-- ============================================
CREATE TABLE IF NOT EXISTS daily_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE NOT NULL,
    direction VARCHAR(10) NOT NULL,      -- 'UP', 'DOWN'
    confidence FLOAT NOT NULL,
    magnitude FLOAT,                      -- Expected % move
    trade_signal VARCHAR(50),            -- 'BUY_TQQQ', 'BUY_SQQQ', 'NO_TRADE'
    signal_strength VARCHAR(20),         -- 'STRONG', 'MODERATE', 'WEAK', 'NO_TRADE'
    position_size FLOAT,
    actual_return FLOAT,                 -- Filled next day
    was_correct BOOLEAN,                 -- Filled next day
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_predictions_date 
ON daily_predictions(date DESC);

-- ============================================
-- Trades Table
-- ============================================
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_id UUID REFERENCES daily_predictions(id),
    ticker VARCHAR(10) NOT NULL,
    action VARCHAR(10) NOT NULL,         -- 'BUY', 'SELL'
    entry_price FLOAT,
    exit_price FLOAT,
    quantity FLOAT,
    pnl FLOAT,
    pnl_percent FLOAT,
    status VARCHAR(20) DEFAULT 'OPEN',   -- 'OPEN', 'CLOSED', 'STOPPED_OUT', 'TAKE_PROFIT'
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trades_status 
ON trades(status);

CREATE INDEX IF NOT EXISTS idx_trades_opened 
ON trades(opened_at DESC);

-- ============================================
-- Performance Snapshots Table
-- ============================================
CREATE TABLE IF NOT EXISTS performance_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    overall_accuracy FLOAT,
    by_horizon JSONB,                    -- {'1d': 0.64, '4h': 0.58, ...}
    by_symbol JSONB,                     -- {'QQQ': 0.64, 'SPY': 0.62, ...}
    total_predictions INTEGER,
    correct_predictions INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_created 
ON performance_snapshots(created_at DESC);

-- ============================================
-- Model Weights Table (for storing pickled models)
-- ============================================
CREATE TABLE IF NOT EXISTS model_weights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version VARCHAR(50) NOT NULL,
    model_type VARCHAR(50) DEFAULT 'production',
    accuracy FLOAT,
    threshold FLOAT,
    weights JSONB,                       -- Ensemble weights
    features_count INTEGER,
    metadata JSONB,                      -- Additional metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_model_weights_version 
ON model_weights(version);

CREATE INDEX IF NOT EXISTS idx_model_weights_created 
ON model_weights(created_at DESC);

-- ============================================
-- Alerts Table (for frontend notifications)
-- ============================================
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(50) NOT NULL,     -- 'TRADE_SIGNAL', 'MODEL_TRAINED', 'PREDICTION'
    title VARCHAR(200) NOT NULL,
    message TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_created 
ON alerts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_unread 
ON alerts(is_read) WHERE is_read = FALSE;

-- ============================================
-- Row Level Security (RLS) - Optional
-- ============================================
-- Enable RLS if you want to restrict access
-- ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE daily_predictions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE performance_snapshots ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE model_weights ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Useful Views
-- ============================================

-- View for recent predictions with accuracy
CREATE OR REPLACE VIEW recent_predictions_accuracy AS
SELECT 
    date,
    direction,
    confidence,
    trade_signal,
    actual_return,
    was_correct,
    CASE 
        WHEN was_correct IS NOT NULL THEN 
            ROUND(AVG(CASE WHEN was_correct THEN 1 ELSE 0 END) OVER (ORDER BY date ROWS BETWEEN 29 PRECEDING AND CURRENT ROW) * 100, 1)
        ELSE NULL 
    END as rolling_30d_accuracy
FROM daily_predictions
ORDER BY date DESC;

-- View for trade performance
CREATE OR REPLACE VIEW trade_performance AS
SELECT 
    DATE_TRUNC('month', opened_at) as month,
    COUNT(*) as total_trades,
    COUNT(CASE WHEN pnl > 0 THEN 1 END) as winning_trades,
    ROUND(AVG(pnl_percent) * 100, 2) as avg_pnl_percent,
    ROUND(SUM(pnl), 2) as total_pnl
FROM trades
WHERE status != 'OPEN'
GROUP BY DATE_TRUNC('month', opened_at)
ORDER BY month DESC;

-- ============================================
-- Functions
-- ============================================

-- Function to update prediction accuracy
CREATE OR REPLACE FUNCTION update_prediction_accuracy()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.actual_return IS NOT NULL AND OLD.actual_return IS NULL THEN
        NEW.was_correct := (
            (NEW.direction = 'UP' AND NEW.actual_return > 0) OR
            (NEW.direction = 'DOWN' AND NEW.actual_return < 0)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update was_correct
DROP TRIGGER IF EXISTS trigger_update_accuracy ON daily_predictions;
CREATE TRIGGER trigger_update_accuracy
    BEFORE UPDATE ON daily_predictions
    FOR EACH ROW
    EXECUTE FUNCTION update_prediction_accuracy();
