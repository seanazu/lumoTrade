"""
Position Sizing Strategies
Vol-targeted and gate-mode position sizing
Ported from multi_factor_model/scripts/train_backtest.py
"""

import numpy as np


def size_position_vol_targeted(
    pred_p10: float,
    pred_p50: float,
    pred_p90: float,
    realized_vol: float,
    vol_target_annual: float = 0.15,
    k_sig: float = 3.0,
    k_spread: float = 1.0,
    wmax: float = 1.0
) -> float:
    """
    Vol-targeted position sizing (continuous).
    
    Adjusts position size based on:
    1. Prediction strength (z-score)
    2. Prediction uncertainty (P90-P10 spread)
    3. Realized volatility (to target specific vol)
    
    Args:
        pred_p10: 10th percentile prediction
        pred_p50: Median prediction
        pred_p90: 90th percentile prediction
        realized_vol: Realized volatility (annualized)
        vol_target_annual: Target annual volatility (default: 0.15 = 15%)
        k_sig: Signal multiplier (default: 3.0)
        k_spread: Spread multiplier (default: 1.0)
        wmax: Maximum leverage (default: 1.0 = no leverage)
    
    Returns:
        Position size in [-1.0, +1.0] (fraction of capital)
    
    Formula:
        1. sigma_pred = (P90 - P10) / 2.56  # 80% confidence interval
        2. z = P50 / sigma_pred  # Signal strength
        3. spread = P90 - P10  # Uncertainty
        4. signal = k_sig × z + k_spread × spread
        5. vol_scalar = (vol_target / sqrt(252)) / realized_vol
        6. position = signal × vol_scalar
        7. position = clip(position, -wmax, +wmax)
    """
    # Estimate prediction uncertainty (standard deviation)
    # P90 - P10 = 1.28 * 2 * sigma for normal dist
    sigma_pred = (pred_p90 - pred_p10) / 2.56
    
    if sigma_pred <= 0 or np.isnan(sigma_pred):
        return 0.0
    
    # Z-score of prediction (signal strength)
    z = pred_p50 / sigma_pred
    
    # Spread factor (higher uncertainty → more aggressive?)
    spread = pred_p90 - pred_p10
    
    # Combined signal
    signal = k_sig * z + k_spread * spread
    
    # Vol scaling
    target_daily_vol = vol_target_annual / np.sqrt(252)
    
    if realized_vol <= 0 or np.isnan(realized_vol):
        vol_scalar = 1.0
    else:
        vol_scalar = target_daily_vol / realized_vol
    
    # Final position
    position = signal * vol_scalar
    
    # Clip to max leverage
    position = np.clip(position, -wmax, wmax)
    
    return float(position)


def size_position_gate_mode(
    pred_p50: float,
    prob_up: float,
    threshold: float = 0.25,
    prob_threshold: float = 0.70
) -> float:
    """
    Gate mode (binary): trade only if confident.
    
    Rules:
    - If |P50| < threshold: position = 0 (no trade)
    - If |P50| >= threshold:
      - If prob_up > prob_threshold: long (+1.0)
      - If prob_up < (1 - prob_threshold): short (-1.0)
      - Else: position = 0
    
    Args:
        pred_p50: Median prediction
        prob_up: Probability of upward movement [0, 1]
        threshold: Minimum |P50| to trade (default: 0.25%)
        prob_threshold: Probability threshold (default: 0.70 = 70%)
    
    Returns:
        Position size in {-1.0, 0.0, +1.0}
    """
    # Check magnitude threshold
    if abs(pred_p50) < threshold:
        return 0.0
    
    # Check direction probability
    if prob_up > prob_threshold:
        return 1.0  # Long
    elif prob_up < (1.0 - prob_threshold):
        return -1.0  # Short
    else:
        return 0.0  # No trade (uncertain)


def size_position_adaptive(
    pred_p10: float,
    pred_p50: float,
    pred_p90: float,
    prob_up: float,
    realized_vol: float,
    mode: str = "auto"
) -> float:
    """
    Adaptive position sizing (switches based on uncertainty).
    
    Args:
        pred_p10, pred_p50, pred_p90: Quantile predictions
        prob_up: Probability of upward movement
        realized_vol: Realized volatility
        mode: "vol_targeted", "gate", or "auto"
    
    Returns:
        Position size
    """
    spread = pred_p90 - pred_p10
    
    if mode == "auto":
        # Use gate mode for high uncertainty, vol-targeted for low
        if spread > 3.0:  # High uncertainty
            return size_position_gate_mode(pred_p50, prob_up)
        else:
            return size_position_vol_targeted(
                pred_p10, pred_p50, pred_p90, realized_vol
            )
    elif mode == "vol_targeted":
        return size_position_vol_targeted(
            pred_p10, pred_p50, pred_p90, realized_vol
        )
    elif mode == "gate":
        return size_position_gate_mode(pred_p50, prob_up)
    else:
        raise ValueError(f"Unknown mode: {mode}")

