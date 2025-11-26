"""
Reinforcement Learning Module
Deep RL for optimal trading execution
"""

try:
    from .ddpg_agent import DDPGAgent, ActorNetwork, CriticNetwork, ReplayBuffer
    from .rl_trader import RLTrader
    HAS_RL = True
except ImportError:
    HAS_RL = False
    print("⚠️  RL module not fully available (missing dependencies)")

__all__ = ['DDPGAgent', 'RLTrader', 'HAS_RL']

