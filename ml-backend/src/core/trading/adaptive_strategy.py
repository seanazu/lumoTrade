"""
Adaptive Trading Strategy

Generates trade signals based on model predictions with adaptive position sizing.
Position size scales with confidence level.
"""

from datetime import datetime
from typing import Dict, Optional
from src.database.supabase_client import get_supabase_client


class AdaptiveStrategy:
    """
    Adaptive trading strategy that adjusts position size based on confidence.
    
    Confidence thresholds:
    - 70%+: STRONG signal, 100% position
    - 60-70%: MODERATE signal, 50% position
    - 55-60%: WEAK signal, 25% position
    - <55%: NO_TRADE, 0% position
    
    Risk management:
    - Stop loss: 5%
    - Take profit: 10%
    """
    
    # Confidence thresholds
    STRONG_THRESHOLD = 0.70
    MODERATE_THRESHOLD = 0.60
    WEAK_THRESHOLD = 0.55
    
    # Position sizes
    STRONG_POSITION = 1.0
    MODERATE_POSITION = 0.5
    WEAK_POSITION = 0.25
    
    # Risk management
    STOP_LOSS = -0.05  # 5% stop loss
    TAKE_PROFIT = 0.10  # 10% take profit
    
    def __init__(self):
        self.supabase = get_supabase_client()
    
    def generate_signal(self, prediction: Dict) -> Dict:
        """
        Generate a trade signal from a model prediction.
        
        Args:
            prediction: Dict with keys:
                - direction: 'UP' or 'DOWN'
                - confidence: float 0-1
                - magnitude: expected % move
        
        Returns:
            Dict with trade signal details
        """
        direction = prediction.get('direction', 'UP')
        confidence = prediction.get('confidence', 0.5)
        magnitude = prediction.get('magnitude', 1.0)
        
        # Determine signal strength and position size
        if confidence >= self.STRONG_THRESHOLD:
            signal_strength = 'STRONG'
            position_size = self.STRONG_POSITION
        elif confidence >= self.MODERATE_THRESHOLD:
            signal_strength = 'MODERATE'
            position_size = self.MODERATE_POSITION
        elif confidence >= self.WEAK_THRESHOLD:
            signal_strength = 'WEAK'
            position_size = self.WEAK_POSITION
        else:
            signal_strength = 'NO_TRADE'
            position_size = 0.0
        
        # Determine ticker based on direction
        if direction == 'UP':
            ticker = 'TQQQ'
            action = 'BUY'
        else:
            ticker = 'SQQQ'
            action = 'BUY'
        
        # Calculate risk levels
        stop_loss_price = None
        take_profit_price = None
        
        signal = {
            'date': datetime.now().strftime('%Y-%m-%d'),
            'time': datetime.now().strftime('%H:%M:%S'),
            'ticker': ticker,
            'action': action if position_size > 0 else 'HOLD',
            'direction': direction,
            'confidence': confidence,
            'signal_strength': signal_strength,
            'position_size': position_size,
            'expected_magnitude': magnitude,
            'stop_loss_pct': self.STOP_LOSS,
            'take_profit_pct': self.TAKE_PROFIT,
            'trade_signal': f"{action}_{ticker}" if position_size > 0 else 'NO_TRADE'
        }
        
        return signal
    
    def evaluate_trade(
        self, 
        entry_price: float, 
        current_price: float,
        direction: str
    ) -> Dict:
        """
        Evaluate an open trade against stop loss and take profit.
        
        Args:
            entry_price: Entry price
            current_price: Current price
            direction: 'UP' or 'DOWN'
        
        Returns:
            Dict with evaluation result
        """
        if direction == 'UP':
            pnl_pct = (current_price - entry_price) / entry_price
        else:
            pnl_pct = (entry_price - current_price) / entry_price
        
        status = 'OPEN'
        action = 'HOLD'
        
        if pnl_pct <= self.STOP_LOSS:
            status = 'STOPPED_OUT'
            action = 'CLOSE'
        elif pnl_pct >= self.TAKE_PROFIT:
            status = 'TAKE_PROFIT'
            action = 'CLOSE'
        
        return {
            'status': status,
            'action': action,
            'pnl_pct': pnl_pct,
            'entry_price': entry_price,
            'current_price': current_price
        }
    
    def get_daily_recommendation(self, prediction: Dict) -> str:
        """
        Get a human-readable daily recommendation.
        
        Args:
            prediction: Model prediction dict
        
        Returns:
            String with recommendation
        """
        signal = self.generate_signal(prediction)
        
        if signal['signal_strength'] == 'NO_TRADE':
            return (
                f"📊 NO TRADE TODAY\n"
                f"Confidence: {signal['confidence']:.1%}\n"
                f"Direction: {signal['direction']}\n"
                f"Reason: Confidence below {self.WEAK_THRESHOLD:.0%} threshold"
            )
        
        emoji = "🟢" if signal['direction'] == 'UP' else "🔴"
        strength_emoji = {
            'STRONG': '💪',
            'MODERATE': '👍',
            'WEAK': '🤏'
        }.get(signal['signal_strength'], '')
        
        return (
            f"{emoji} {signal['signal_strength']} {signal['direction']} SIGNAL {strength_emoji}\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"📈 Trade: {signal['trade_signal']}\n"
            f"🎯 Confidence: {signal['confidence']:.1%}\n"
            f"📊 Position Size: {signal['position_size']:.0%}\n"
            f"📉 Expected Move: {signal['expected_magnitude']:.1f}%\n"
            f"🛑 Stop Loss: {abs(signal['stop_loss_pct']):.0%}\n"
            f"✅ Take Profit: {signal['take_profit_pct']:.0%}"
        )
    
    def save_trade(
        self,
        prediction_id: str,
        signal: Dict,
        entry_price: Optional[float] = None
    ) -> bool:
        """
        Save a trade to Supabase.
        
        Args:
            prediction_id: ID of the prediction
            signal: Trade signal dict
            entry_price: Optional entry price
        
        Returns:
            True if successful
        """
        if not self.supabase.enabled:
            return False
        
        try:
            # Store using the existing prediction storage
            self.supabase.store_prediction(
                prediction_id=prediction_id,
                symbol=signal['ticker'],
                horizon='1d',
                predicted_direction=signal['direction'].lower(),
                predicted_return=signal['expected_magnitude'],
                confidence=signal['confidence'],
                timestamp=datetime.now()
            )
            return True
        except Exception as e:
            print(f"Error saving trade: {e}")
            return False


# Singleton instance
_strategy = None

def get_strategy() -> AdaptiveStrategy:
    """Get the singleton strategy instance"""
    global _strategy
    if _strategy is None:
        _strategy = AdaptiveStrategy()
    return _strategy

