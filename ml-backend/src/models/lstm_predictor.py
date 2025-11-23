"""
LSTM Model with Attention for Market Prediction
"""
import torch
import torch.nn as nn
import numpy as np
from typing import Tuple, Optional, Dict
import pickle

class AttentionLayer(nn.Module):
    """Attention mechanism for LSTM"""
    def __init__(self, hidden_size: int):
        super(AttentionLayer, self).__init__()
        self.attention = nn.Linear(hidden_size, 1)
    
    def forward(self, lstm_output):
        # lstm_output shape: (batch, seq_len, hidden_size)
        attention_weights = torch.softmax(self.attention(lstm_output), dim=1)
        # attention_weights shape: (batch, seq_len, 1)
        
        # Apply attention weights
        context = torch.sum(attention_weights * lstm_output, dim=1)
        # context shape: (batch, hidden_size)
        
        return context, attention_weights

class LSTMPredictor(nn.Module):
    """
    Multi-layer LSTM with attention for market prediction
    
    Predicts:
    - Direction (up/down) - classification
    - Expected move (%) - regression
    - Confidence score
    """
    def __init__(
        self,
        input_size: int,
        hidden_size: int = 128,
        num_layers: int = 3,
        dropout: float = 0.3
    ):
        super(LSTMPredictor, self).__init__()
        
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        # LSTM layers
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )
        
        # Attention layer
        self.attention = AttentionLayer(hidden_size)
        
        # Output heads
        self.direction_head = nn.Sequential(
            nn.Linear(hidden_size, 64),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(64, 2)  # Binary classification: up or down
        )
        
        self.magnitude_head = nn.Sequential(
            nn.Linear(hidden_size, 64),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(64, 1)  # Regression: expected % move
        )
        
        self.confidence_head = nn.Sequential(
            nn.Linear(hidden_size, 32),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(32, 1),
            nn.Sigmoid()  # Output 0-1 confidence score
        )
    
    def forward(self, x):
        # x shape: (batch, seq_len, input_size)
        
        # LSTM forward pass
        lstm_out, (hidden, cell) = self.lstm(x)
        # lstm_out shape: (batch, seq_len, hidden_size)
        
        # Apply attention
        context, attention_weights = self.attention(lstm_out)
        # context shape: (batch, hidden_size)
        
        # Multiple output heads
        direction_logits = self.direction_head(context)  # (batch, 2)
        magnitude = self.magnitude_head(context)  # (batch, 1)
        confidence = self.confidence_head(context)  # (batch, 1)
        
        return {
            "direction_logits": direction_logits,
            "direction_probs": torch.softmax(direction_logits, dim=1),
            "magnitude": magnitude,
            "confidence": confidence,
            "attention_weights": attention_weights
        }
    
    def predict(self, x: np.ndarray, scaler=None) -> Dict:
        """
        Make prediction on input data
        
        Args:
            x: Input features (seq_len, input_size) or (batch, seq_len, input_size)
            scaler: Optional scaler to inverse transform magnitude
        
        Returns:
            Dictionary with prediction results
        """
        self.eval()
        with torch.no_grad():
            # Handle single sample
            if x.ndim == 2:
                x = x[np.newaxis, :]  # Add batch dimension
            
            # Convert to tensor
            x_tensor = torch.FloatTensor(x)
            
            # Forward pass
            output = self.forward(x_tensor)
            
            # Extract predictions
            direction_probs = output["direction_probs"][0].cpu().numpy()
            direction = "bullish" if direction_probs[1] > direction_probs[0] else "bearish"
            direction_confidence = float(max(direction_probs))
            
            magnitude = float(output["magnitude"][0, 0].cpu().numpy())
            confidence = float(output["confidence"][0, 0].cpu().numpy())
            
            return {
                "direction": direction,
                "direction_confidence": direction_confidence,
                "direction_probs": {
                    "down": float(direction_probs[0]),
                    "up": float(direction_probs[1])
                },
                "expected_move_percent": magnitude,
                "overall_confidence": confidence
            }

def save_model(model: LSTMPredictor, scaler, model_path: str, scaler_path: str):
    """Save model and scaler to disk"""
    torch.save({
        "model_state_dict": model.state_dict(),
        "input_size": model.input_size,
        "hidden_size": model.hidden_size,
        "num_layers": model.num_layers
    }, model_path)
    
    with open(scaler_path, "wb") as f:
        pickle.dump(scaler, f)
    
    print(f"Model saved to {model_path}")
    print(f"Scaler saved to {scaler_path}")

def load_model(model_path: str, scaler_path: str) -> Tuple[LSTMPredictor, any]:
    """Load model and scaler from disk"""
    # Load model
    checkpoint = torch.load(model_path, map_location=torch.device('cpu'))
    
    model = LSTMPredictor(
        input_size=checkpoint["input_size"],
        hidden_size=checkpoint["hidden_size"],
        num_layers=checkpoint["num_layers"]
    )
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    
    # Load scaler
    with open(scaler_path, "rb") as f:
        scaler = pickle.load(f)
    
    print(f"Model loaded from {model_path}")
    print(f"Scaler loaded from {scaler_path}")
    
    return model, scaler

