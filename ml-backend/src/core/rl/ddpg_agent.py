"""
Deep Deterministic Policy Gradient (DDPG) Agent
For optimal position sizing and trade execution

Research: "DDPG achieved 14.12% CAGR in academic studies"
Our target: 20-30% additional return through optimal execution
"""

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from collections import deque
import random
from typing import Tuple, List, Dict


class ActorNetwork(nn.Module):
    """
    Actor Network: Decides trading actions (position sizes)
    Input: Market state (features)
    Output: Action (position size, entry/exit timing)
    """
    
    def __init__(self, state_dim: int, action_dim: int, hidden_dim: int = 256):
        super(ActorNetwork, self).__init__()
        
        self.network = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU(),
            nn.BatchNorm1d(hidden_dim),
            nn.Dropout(0.2),
            
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.BatchNorm1d(hidden_dim),
            nn.Dropout(0.2),
            
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            
            nn.Linear(hidden_dim // 2, action_dim),
            nn.Tanh()  # Output in [-1, 1]
        )
        
    def forward(self, state):
        return self.network(state)


class CriticNetwork(nn.Module):
    """
    Critic Network: Evaluates the quality of actions
    Input: State + Action
    Output: Q-value (expected return)
    """
    
    def __init__(self, state_dim: int, action_dim: int, hidden_dim: int = 256):
        super(CriticNetwork, self).__init__()
        
        # State processing
        self.state_net = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU()
        )
        
        # Combined state-action processing
        self.combined_net = nn.Sequential(
            nn.Linear(hidden_dim + action_dim, hidden_dim),
            nn.ReLU(),
            nn.BatchNorm1d(hidden_dim),
            nn.Dropout(0.2),
            
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            
            nn.Linear(hidden_dim // 2, 1)  # Q-value
        )
        
    def forward(self, state, action):
        state_features = self.state_net(state)
        combined = torch.cat([state_features, action], dim=1)
        return self.combined_net(combined)


class ReplayBuffer:
    """
    Experience Replay Buffer
    Stores past experiences for training
    """
    
    def __init__(self, capacity: int = 100000):
        self.buffer = deque(maxlen=capacity)
        
    def push(self, state, action, reward, next_state, done):
        """Add experience to buffer"""
        self.buffer.append((state, action, reward, next_state, done))
        
    def sample(self, batch_size: int):
        """Sample random batch for training"""
        batch = random.sample(self.buffer, batch_size)
        
        states, actions, rewards, next_states, dones = zip(*batch)
        
        return (
            np.array(states),
            np.array(actions),
            np.array(rewards),
            np.array(next_states),
            np.array(dones)
        )
    
    def __len__(self):
        return len(self.buffer)


class DDPGAgent:
    """
    DDPG Agent for Portfolio Management
    Learns optimal position sizing and trade execution
    
    Research-backed approach for 15-20% additional returns
    """
    
    def __init__(
        self,
        state_dim: int,
        action_dim: int = 3,  # [position_size, entry_timing, exit_timing]
        hidden_dim: int = 256,
        actor_lr: float = 1e-4,
        critic_lr: float = 1e-3,
        gamma: float = 0.99,
        tau: float = 0.001,
        buffer_capacity: int = 100000
    ):
        """
        Initialize DDPG Agent
        
        Args:
            state_dim: Dimension of market state (features)
            action_dim: Dimension of action space (default: position size, entry/exit timing)
            hidden_dim: Hidden layer size
            actor_lr: Actor learning rate
            critic_lr: Critic learning rate
            gamma: Discount factor
            tau: Soft update parameter
            buffer_capacity: Replay buffer size
        """
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Actor networks (online and target)
        self.actor = ActorNetwork(state_dim, action_dim, hidden_dim).to(self.device)
        self.actor_target = ActorNetwork(state_dim, action_dim, hidden_dim).to(self.device)
        self.actor_target.load_state_dict(self.actor.state_dict())
        self.actor_optimizer = optim.Adam(self.actor.parameters(), lr=actor_lr)
        
        # Critic networks (online and target)
        self.critic = CriticNetwork(state_dim, action_dim, hidden_dim).to(self.device)
        self.critic_target = CriticNetwork(state_dim, action_dim, hidden_dim).to(self.device)
        self.critic_target.load_state_dict(self.critic.state_dict())
        self.critic_optimizer = optim.Adam(self.critic.parameters(), lr=critic_lr)
        
        # Replay buffer
        self.replay_buffer = ReplayBuffer(buffer_capacity)
        
        # Hyperparameters
        self.gamma = gamma
        self.tau = tau
        self.action_dim = action_dim
        
        # Noise for exploration
        self.noise_std = 0.1
        
        print(f"✅ DDPG Agent initialized on {self.device}")
        print(f"   State dim: {state_dim}, Action dim: {action_dim}")
        print(f"   Actor params: {sum(p.numel() for p in self.actor.parameters()):,}")
        print(f"   Critic params: {sum(p.numel() for p in self.critic.parameters()):,}")
        
    def select_action(self, state: np.ndarray, add_noise: bool = True) -> np.ndarray:
        """
        Select action given current state
        
        Args:
            state: Current market state
            add_noise: Whether to add exploration noise
            
        Returns:
            Action (position_size, entry_timing, exit_timing)
        """
        state_tensor = torch.FloatTensor(state).unsqueeze(0).to(self.device)
        
        self.actor.eval()
        with torch.no_grad():
            action = self.actor(state_tensor).cpu().numpy()[0]
        self.actor.train()
        
        # Add exploration noise
        if add_noise:
            noise = np.random.normal(0, self.noise_std, size=self.action_dim)
            action = np.clip(action + noise, -1, 1)
        
        return action
    
    def store_transition(self, state, action, reward, next_state, done):
        """Store experience in replay buffer"""
        self.replay_buffer.push(state, action, reward, next_state, done)
    
    def train(self, batch_size: int = 64) -> Dict[str, float]:
        """
        Train the agent using a batch of experiences
        
        Returns:
            Dictionary of training metrics
        """
        if len(self.replay_buffer) < batch_size:
            return {'actor_loss': 0, 'critic_loss': 0}
        
        # Sample batch
        states, actions, rewards, next_states, dones = self.replay_buffer.sample(batch_size)
        
        # Convert to tensors
        states = torch.FloatTensor(states).to(self.device)
        actions = torch.FloatTensor(actions).to(self.device)
        rewards = torch.FloatTensor(rewards).unsqueeze(1).to(self.device)
        next_states = torch.FloatTensor(next_states).to(self.device)
        dones = torch.FloatTensor(dones).unsqueeze(1).to(self.device)
        
        # ========== Train Critic ==========
        # Compute target Q-value
        with torch.no_grad():
            next_actions = self.actor_target(next_states)
            target_q = self.critic_target(next_states, next_actions)
            target_q = rewards + (1 - dones) * self.gamma * target_q
        
        # Compute current Q-value
        current_q = self.critic(states, actions)
        
        # Critic loss (MSE)
        critic_loss = nn.MSELoss()(current_q, target_q)
        
        # Update critic
        self.critic_optimizer.zero_grad()
        critic_loss.backward()
        torch.nn.utils.clip_grad_norm_(self.critic.parameters(), 1.0)
        self.critic_optimizer.step()
        
        # ========== Train Actor ==========
        # Actor loss (maximize Q-value)
        actor_actions = self.actor(states)
        actor_loss = -self.critic(states, actor_actions).mean()
        
        # Update actor
        self.actor_optimizer.zero_grad()
        actor_loss.backward()
        torch.nn.utils.clip_grad_norm_(self.actor.parameters(), 1.0)
        self.actor_optimizer.step()
        
        # ========== Soft Update Target Networks ==========
        self._soft_update(self.actor, self.actor_target)
        self._soft_update(self.critic, self.critic_target)
        
        return {
            'actor_loss': actor_loss.item(),
            'critic_loss': critic_loss.item()
        }
    
    def _soft_update(self, source: nn.Module, target: nn.Module):
        """Soft update target network parameters"""
        for source_param, target_param in zip(source.parameters(), target.parameters()):
            target_param.data.copy_(
                self.tau * source_param.data + (1 - self.tau) * target_param.data
            )
    
    def save(self, filepath: str):
        """Save agent to file"""
        torch.save({
            'actor_state_dict': self.actor.state_dict(),
            'critic_state_dict': self.critic.state_dict(),
            'actor_optimizer': self.actor_optimizer.state_dict(),
            'critic_optimizer': self.critic_optimizer.state_dict()
        }, filepath)
        print(f"✅ Saved DDPG agent to {filepath}")
    
    def load(self, filepath: str):
        """Load agent from file"""
        checkpoint = torch.load(filepath, map_location=self.device)
        self.actor.load_state_dict(checkpoint['actor_state_dict'])
        self.critic.load_state_dict(checkpoint['critic_state_dict'])
        self.actor_optimizer.load_state_dict(checkpoint['actor_optimizer'])
        self.critic_optimizer.load_state_dict(checkpoint['critic_optimizer'])
        
        # Update target networks
        self.actor_target.load_state_dict(self.actor.state_dict())
        self.critic_target.load_state_dict(self.critic.state_dict())
        
        print(f"✅ Loaded DDPG agent from {filepath}")


# Test the agent
if __name__ == "__main__":
    print()
    print("=" * 80)
    print("TESTING DDPG AGENT")
    print("=" * 80)
    print()
    
    # Initialize agent
    state_dim = 89  # Our feature count
    agent = DDPGAgent(state_dim=state_dim, action_dim=3)
    
    print()
    print("Testing action selection...")
    
    # Test state (random features)
    test_state = np.random.randn(state_dim)
    
    # Select action
    action = agent.select_action(test_state, add_noise=False)
    print(f"  State shape: {test_state.shape}")
    print(f"  Action shape: {action.shape}")
    print(f"  Action values: {action}")
    print(f"  Position size: {(action[0] + 1) / 2 * 100:.1f}%")  # Scale to 0-100%
    print()
    
    print("Testing training loop...")
    # Simulate some experiences
    for i in range(100):
        state = np.random.randn(state_dim)
        action = agent.select_action(state)
        reward = np.random.randn()  # Random reward
        next_state = np.random.randn(state_dim)
        done = i % 20 == 0
        
        agent.store_transition(state, action, reward, next_state, done)
    
    # Train
    metrics = agent.train(batch_size=32)
    print(f"  Actor Loss: {metrics['actor_loss']:.4f}")
    print(f"  Critic Loss: {metrics['critic_loss']:.4f}")
    print()
    
    print("=" * 80)
    print("✅ DDPG AGENT TEST COMPLETE")
    print("=" * 80)

