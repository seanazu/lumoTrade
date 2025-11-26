"""
Training: Walk-forward validation and ultimate trainer.
"""

from .validator import create_walk_forward_folds, WalkForwardSplitter
from .ultimate_trainer import UltimateTrainer

# Create singleton instance
ultimate_trainer = UltimateTrainer()

__all__ = ['create_walk_forward_folds', 'WalkForwardSplitter', 'UltimateTrainer', 'ultimate_trainer']
