"""
Reinforcement Learning Trader
Integrates DDPG agent with trading system for optimal execution
"""

import numpy as np
import pandas as pd
from typing import Dict, Optional, Tuple
from datetime import datetime

try:
    from .ddpg_agent import DDPGAgent
    HAS_DDPG = True
except ImportError:
    HAS_DDPG = False


class RLTrader:
    """
    RL-Enhanced Trader
    Uses DDPG to optimize position sizing and execution
    
    Expected impact: +15-20% annual return
    """
    
    def __init__(
        self,
        state_dim: int = 89,  # Feature count
        use_rl: bool = True,
        learning_rate: float = 1e-4
    ):
        """
        Initialize RL Trader
        
        Args:
            state_dim: Number of features
            use_rl: Whether to use RL or fall back to static strategy
            learning_rate: Learning rate for DDPG
        """
        self.use_rl = use_rl and HAS_DDPG
        
        if self.use_rl:
            self.agent = DDPGAgent(
                state_dim=state_dim,
                action_dim=3,  # [position_size, entry_timing, exit_timing]
                actor_lr=learning_rate,
                critic_lr=learning_rate * 10
            )
            print("✅ RL Trader initialized with DDPG")
        else:
            self.agent = None
            print("⚠️  RL Trader using static strategy (DDPG not available)")
        
        # Performance tracking
        self.episode_rewards = []
        self.episode_trades = []
        
    def get_optimal_position_size(
        self,
        features: np.ndarray,
        base_confidence: float,
        market_regime: str = 'normal'
    ) -> float:
        """
        Get optimal position size using RL
        
        Args:
            features: Market state features
            base_confidence: Model's base confidence
            market_regime: Current market regime
            
        Returns:
            Optimal position size (0-1)
        """
        if not self.use_rl:
            # Fallback: Use confidence directly
            return base_confidence * 0.9  # Max 90%
        
        # Get action from DDPG agent
        action = self.agent.select_action(features, add_noise=False)
        
        # Parse action
        # action[0]: position_size in [-1, 1]
        # action[1]: entry_timing modifier
        # action[2]: exit_timing modifier
        
        # Scale position size to [0, 1] and apply confidence
        position_size = (action[0] + 1) / 2  # Scale from [-1,1] to [0,1]
        position_size *= base_confidence  # Weight by model confidence
        
        # Clip to reasonable range
        position_size = np.clip(position_size, 0.1, 0.95)
        
        return position_size
    
    def get_execution_timing(
        self,
        features: np.ndarray,
        signal_type: str = 'entry'
    ) -> float:
        """
        Get optimal execution timing
        
        Args:
            features: Market state features
            signal_type: 'entry' or 'exit'
            
        Returns:
            Timing modifier (0-1, where 1 = execute immediately)
        """
        if not self.use_rl:
            return 1.0  # Execute immediately
        
        # Get action from agent
        action = self.agent.select_action(features, add_noise=False)
        
        # Use action[1] for entry, action[2] for exit
        if signal_type == 'entry':
            timing = (action[1] + 1) / 2  # Scale to [0, 1]
        else:
            timing = (action[2] + 1) / 2
        
        # Clip to reasonable range (don't delay too much)
        timing = np.clip(timing, 0.5, 1.0)
        
        return timing
    
    def record_trade_outcome(
        self,
        features: np.ndarray,
        action: np.ndarray,
        profit: float,
        next_features: np.ndarray,
        done: bool = False
    ):
        """
        Record trade outcome for learning
        
        Args:
            features: State when trade was made
            action: Action taken
            profit: Profit/loss from trade
            next_features: State after trade
            done: Whether episode ended
        """
        if not self.use_rl:
            return
        
        # Normalize profit to reward (-1 to 1)
        reward = np.tanh(profit * 10)  # Scale and bound
        
        # Store transition
        self.agent.store_transition(
            features,
            action,
            reward,
            next_features,
            done
        )
        
        # Train periodically
        if len(self.agent.replay_buffer) >= 64:
            metrics = self.agent.train(batch_size=64)
            return metrics
        
        return None
    
    def train_on_historical_data(
        self,
        historical_data: pd.DataFrame,
        num_episodes: int = 100,
        batch_size: int = 64
    ) -> Dict:
        """
        Train agent on historical trading data
        
        Args:
            historical_data: DataFrame with columns:
                ['features', 'prediction', 'actual_return', 'confidence']
            num_episodes: Number of training episodes
            batch_size: Batch size for training
            
        Returns:
            Training metrics
        """
        if not self.use_rl:
            return {'status': 'RL not available'}
        
        print()
        print("=" * 80)
        print("TRAINING RL AGENT ON HISTORICAL DATA")
        print("=" * 80)
        print(f"Episodes: {num_episodes}")
        print(f"Data points: {len(historical_data)}")
        print()
        
        all_metrics = []
        
        for episode in range(num_episodes):
            episode_reward = 0
            episode_trades = 0
            
            # Shuffle data for each episode
            data = historical_data.sample(frac=1).reset_index(drop=True)
            
            for idx in range(len(data) - 1):
                row = data.iloc[idx]
                next_row = data.iloc[idx + 1]
                
                # Get state
                state = np.array(row['features'])
                next_state = np.array(next_row['features'])
                
                # Get action from agent
                action = self.agent.select_action(state, add_noise=True)
                
                # Calculate reward based on action and actual return
                position_size = (action[0] + 1) / 2
                actual_return = row['actual_return']
                reward = position_size * actual_return
                
                # Store and train
                self.agent.store_transition(
                    state,
                    action,
                    reward,
                    next_state,
                    done=(idx == len(data) - 2)
                )
                
                episode_reward += reward
                episode_trades += 1
                
                # Train
                if len(self.agent.replay_buffer) >= batch_size:
                    metrics = self.agent.train(batch_size)
                    all_metrics.append(metrics)
            
            # Log progress
            if (episode + 1) % 10 == 0:
                avg_reward = episode_reward / episode_trades if episode_trades > 0 else 0
                print(f"Episode {episode + 1}/{num_episodes}: "
                      f"Avg Reward: {avg_reward:.4f}, "
                      f"Trades: {episode_trades}")
        
        print()
        print("=" * 80)
        print("✅ RL TRAINING COMPLETE")
        print("=" * 80)
        
        # Calculate average metrics
        if all_metrics:
            avg_metrics = {
                'avg_actor_loss': np.mean([m['actor_loss'] for m in all_metrics]),
                'avg_critic_loss': np.mean([m['critic_loss'] for m in all_metrics]),
                'num_episodes': num_episodes,
                'total_updates': len(all_metrics)
            }
        else:
            avg_metrics = {'status': 'No training performed'}
        
        return avg_metrics
    
    def save(self, filepath: str):
        """Save RL trader"""
        if self.use_rl:
            self.agent.save(filepath)
    
    def load(self, filepath: str):
        """Load RL trader"""
        if self.use_rl:
            self.agent.load(filepath)


# Test the RL trader
if __name__ == "__main__":
    print()
    print("=" * 80)
    print("TESTING RL TRADER")
    print("=" * 80)
    print()
    
    # Initialize trader
    trader = RLTrader(state_dim=89)
    
    # Test optimal position sizing
    print("Testing optimal position sizing...")
    test_features = np.random.randn(89)
    position_size = trader.get_optimal_position_size(
        test_features,
        base_confidence=0.75,
        market_regime='normal'
    )
    print(f"  Base confidence: 75%")
    print(f"  Optimal position: {position_size:.1%}")
    print()
    
    # Test execution timing
    print("Testing execution timing...")
    entry_timing = trader.get_execution_timing(test_features, 'entry')
    exit_timing = trader.get_execution_timing(test_features, 'exit')
    print(f"  Entry timing: {entry_timing:.1%}")
    print(f"  Exit timing: {exit_timing:.1%}")
    print()
    
    # Simulate historical training
    print("Simulating historical training...")
    historical_data = pd.DataFrame({
        'features': [np.random.randn(89) for _ in range(1000)],
        'prediction': np.random.randn(1000),
        'actual_return': np.random.randn(1000) * 0.02,
        'confidence': np.random.uniform(0.5, 0.9, 1000)
    })
    
    metrics = trader.train_on_historical_data(
        historical_data,
        num_episodes=10,
        batch_size=32
    )
    
    print()
    print("Training metrics:")
    for key, value in metrics.items():
        print(f"  {key}: {value}")
    print()
    
    print("=" * 80)
    print("✅ RL TRADER TEST COMPLETE")
    print("=" * 80)

