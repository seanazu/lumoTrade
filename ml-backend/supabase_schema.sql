-- Supabase Schema for LumoTrade ML Backend
-- Run this in Supabase SQL Editor after creating your project

-- ==================== Training Sessions Table ====================
CREATE TABLE IF NOT EXISTS training_sessions (
    id BIGSERIAL PRIMARY KEY,
    session_type TEXT NOT NULL,
    index TEXT NOT NULL,
    lookback_days INTEGER,
    samples INTEGER,
    annual_return DECIMAL(10, 4),
    sharpe_ratio DECIMAL(10, 4),
    max_drawdown DECIMAL(10, 4),
    win_rate DECIMAL(10, 4),
    total_trades INTEGER,
    avg_profit_per_trade DECIMAL(10, 6),
    direction_accuracy DECIMAL(10, 4),
    metrics_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_training_sessions_created_at ON training_sessions(created_at DESC);
CREATE INDEX idx_training_sessions_index ON training_sessions(index);

-- ==================== Predictions Table ====================
CREATE TABLE IF NOT EXISTS predictions (
    id BIGSERIAL PRIMARY KEY,
    prediction_id TEXT UNIQUE NOT NULL,
    symbol TEXT NOT NULL,
    horizon TEXT NOT NULL,
    predicted_direction TEXT NOT NULL,
    predicted_return DECIMAL(10, 6),
    confidence DECIMAL(5, 4),
    actual_direction TEXT,
    actual_return DECIMAL(10, 6),
    correct BOOLEAN,
    timestamp TIMESTAMPTZ NOT NULL,
    validated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_predictions_symbol ON predictions(symbol);
CREATE INDEX idx_predictions_timestamp ON predictions(timestamp DESC);
CREATE INDEX idx_predictions_validated ON predictions(validated_at);

-- ==================== Performance Snapshots Table ====================
CREATE TABLE IF NOT EXISTS performance_snapshots (
    id BIGSERIAL PRIMARY KEY,
    overall_accuracy DECIMAL(5, 4),
    by_horizon JSONB,
    by_symbol JSONB,
    total_predictions INTEGER,
    correct_predictions INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_performance_snapshots_created_at ON performance_snapshots(created_at DESC);

-- ==================== Enable Row Level Security (RLS) ====================
-- This allows your API key to read/write data

ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_snapshots ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations with anon key
CREATE POLICY "Enable all operations for anon"
ON training_sessions
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all operations for anon"
ON predictions
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all operations for anon"
ON performance_snapshots
FOR ALL
USING (true)
WITH CHECK (true);

-- ==================== Sample Queries ====================

-- Get recent training sessions
-- SELECT * FROM training_sessions ORDER BY created_at DESC LIMIT 10;

-- Get predictions for SPY
-- SELECT * FROM predictions WHERE symbol = 'SPY' ORDER BY timestamp DESC LIMIT 100;

-- Get performance over time
-- SELECT created_at, overall_accuracy FROM performance_snapshots ORDER BY created_at DESC;

-- Average return by index
-- SELECT index, AVG(annual_return) as avg_return, COUNT(*) as sessions
-- FROM training_sessions
-- GROUP BY index;

