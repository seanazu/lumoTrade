"""
Model Training Script
"""
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import asyncio
from pathlib import Path

from src.data.data_loader import data_loader
from src.data.feature_engineering import FeatureEngineer
from src.models.lstm_predictor import LSTMPredictor, save_model

class ModelTrainer:
    def __init__(
        self,
        hidden_size: int = 128,
        num_layers: int = 3,
        dropout: float = 0.3,
        learning_rate: float = 0.001,
        batch_size: int = 32,
        epochs: int = 100
    ):
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.dropout = dropout
        self.learning_rate = learning_rate
        self.batch_size = batch_size
        self.epochs = epochs
        
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"Using device: {self.device}")

    async def prepare_training_data(
        self,
        symbol: str = "SPY",
        start_date: str = "2022-01-01",
        end_date: str = "2024-01-01",
        sequence_length: int = 60
    ):
        """Load and prepare training data"""
        print(f"\n1️⃣ Loading historical data for {symbol}...")
        
        # Load raw OHLCV data
        df = await data_loader.load_historical_data(
            symbol=symbol,
            start_date=start_date,
            end_date=end_date,
            interval="1min"
        )
        print(f"   Loaded {len(df)} records")
        
        # Engineer features
        print("\n2️⃣  Engineering features...")
        feature_engineer = FeatureEngineer()
        df_features = feature_engineer.engineer_features(df)
        print(f"   Created {len(df_features.columns)} features")
        
        # Remove NaN values from indicator calculations
        df_features = df_features.dropna()
        print(f"   After cleaning: {len(df_features)} records")
        
        # Select features (exclude timestamp and target)
        feature_columns = [col for col in df_features.columns 
                          if col not in ["timestamp", "target", "symbol"]]
        
        print(f"   Using {len(feature_columns)} features for training")
        
        # Create sequences
        print("\n3️⃣  Creating sequences...")
        X_sequences = []
        y_direction = []
        y_magnitude = []
        
        feature_data = df_features[feature_columns].values
        close_prices = df_features["close"].values
        
        for i in range(sequence_length, len(feature_data)):
            X_sequences.append(feature_data[i - sequence_length:i])
            
            # Direction target: 1 for up, 0 for down
            current_close = close_prices[i - 1]
            next_close = close_prices[i]
            y_direction.append(1 if next_close > current_close else 0)
            
            # Magnitude target: % change
            pct_change = ((next_close - current_close) / current_close) * 100
            y_magnitude.append(pct_change)
        
        X = np.array(X_sequences)
        y_dir = np.array(y_direction)
        y_mag = np.array(y_magnitude)
        
        print(f"   Created {len(X)} sequences")
        print(f"   X shape: {X.shape}")
        print(f"   Direction distribution: Up={y_dir.sum()}, Down={(1-y_dir).sum()}")
        
        # Normalize features
        print("\n4️⃣  Normalizing features...")
        scaler = StandardScaler()
        
        # Flatten for scaling, then reshape back
        X_reshaped = X.reshape(-1, X.shape[-1])
        X_scaled = scaler.fit_transform(X_reshaped)
        X_scaled = X_scaled.reshape(X.shape)
        
        return X_scaled, y_dir, y_mag, scaler, len(feature_columns)

    def train(
        self,
        X: np.ndarray,
        y_direction: np.ndarray,
        y_magnitude: np.ndarray,
        num_features: int,
        scaler
    ):
        """Train the LSTM model"""
        print("\n5️⃣  Splitting train/validation...")
        
        # Split data
        X_train, X_val, y_dir_train, y_dir_val, y_mag_train, y_mag_val = train_test_split(
            X, y_direction, y_magnitude,
            test_size=0.2,
            shuffle=False  # Important for time series
        )
        
        print(f"   Train: {len(X_train)} samples")
        print(f"   Validation: {len(X_val)} samples")
        
        # Create data loaders
        train_dataset = TensorDataset(
            torch.FloatTensor(X_train),
            torch.LongTensor(y_dir_train),
            torch.FloatTensor(y_mag_train)
        )
        val_dataset = TensorDataset(
            torch.FloatTensor(X_val),
            torch.LongTensor(y_dir_val),
            torch.FloatTensor(y_mag_val)
        )
        
        train_loader = DataLoader(train_dataset, batch_size=self.batch_size, shuffle=True)
        val_loader = DataLoader(val_dataset, batch_size=self.batch_size, shuffle=False)
        
        # Initialize model
        print(f"\n6️⃣  Initializing model...")
        model = LSTMPredictor(
            input_size=num_features,
            hidden_size=self.hidden_size,
            num_layers=self.num_layers,
            dropout=self.dropout
        ).to(self.device)
        
        print(f"   Model parameters: {sum(p.numel() for p in model.parameters()):,}")
        
        # Loss functions and optimizer
        direction_criterion = nn.CrossEntropyLoss()
        magnitude_criterion = nn.MSELoss()
        optimizer = optim.Adam(model.parameters(), lr=self.learning_rate)
        scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', patience=5, factor=0.5)
        
        # Training loop
        print(f"\n7️⃣  Training for {self.epochs} epochs...")
        best_val_loss = float('inf')
        patience_counter = 0
        
        for epoch in range(self.epochs):
            # Training
            model.train()
            train_loss = 0.0
            train_dir_correct = 0
            train_samples = 0
            
            for X_batch, y_dir_batch, y_mag_batch in train_loader:
                X_batch = X_batch.to(self.device)
                y_dir_batch = y_dir_batch.to(self.device)
                y_mag_batch = y_mag_batch.to(self.device).unsqueeze(1)
                
                optimizer.zero_grad()
                
                output = model(X_batch)
                
                # Combined loss
                dir_loss = direction_criterion(output["direction_logits"], y_dir_batch)
                mag_loss = magnitude_criterion(output["magnitude"], y_mag_batch)
                loss = dir_loss + 0.5 * mag_loss  # Weight magnitude loss lower
                
                loss.backward()
                torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                optimizer.step()
                
                train_loss += loss.item() * len(X_batch)
                train_dir_correct += (output["direction_logits"].argmax(1) == y_dir_batch).sum().item()
                train_samples += len(X_batch)
            
            train_loss /= train_samples
            train_accuracy = train_dir_correct / train_samples
            
            # Validation
            model.eval()
            val_loss = 0.0
            val_dir_correct = 0
            val_samples = 0
            
            with torch.no_grad():
                for X_batch, y_dir_batch, y_mag_batch in val_loader:
                    X_batch = X_batch.to(self.device)
                    y_dir_batch = y_dir_batch.to(self.device)
                    y_mag_batch = y_mag_batch.to(self.device).unsqueeze(1)
                    
                    output = model(X_batch)
                    
                    dir_loss = direction_criterion(output["direction_logits"], y_dir_batch)
                    mag_loss = magnitude_criterion(output["magnitude"], y_mag_batch)
                    loss = dir_loss + 0.5 * mag_loss
                    
                    val_loss += loss.item() * len(X_batch)
                    val_dir_correct += (output["direction_logits"].argmax(1) == y_dir_batch).sum().item()
                    val_samples += len(X_batch)
            
            val_loss /= val_samples
            val_accuracy = val_dir_correct / val_samples
            
            # Learning rate scheduling
            scheduler.step(val_loss)
            
            # Print progress
            if (epoch + 1) % 5 == 0:
                print(f"   Epoch {epoch+1}/{self.epochs}")
                print(f"      Train Loss: {train_loss:.4f}, Acc: {train_accuracy:.4f}")
                print(f"      Val Loss: {val_loss:.4f}, Acc: {val_accuracy:.4f}")
            
            # Early stopping
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                patience_counter = 0
                
                # Save best model
                Path("models").mkdir(exist_ok=True)
                save_model(model, scaler, "models/best_model.pth", "models/scaler.pkl")
            else:
                patience_counter += 1
                if patience_counter >= 10:
                    print(f"\n   Early stopping at epoch {epoch+1}")
                    break
        
        print(f"\n✅ Training complete! Best val loss: {best_val_loss:.4f}")
        return model, scaler

async def main():
    """Main training script"""
    trainer = ModelTrainer(
        hidden_size=128,
        num_layers=3,
        dropout=0.3,
        learning_rate=0.001,
        batch_size=32,
        epochs=100
    )
    
    # Prepare data
    X, y_dir, y_mag, scaler, num_features = await trainer.prepare_training_data(
        symbol="SPY",
        start_date="2022-01-01",
        end_date="2024-01-01",
        sequence_length=60
    )
    
    # Train model
    model, scaler = trainer.train(X, y_dir, y_mag, num_features, scaler)
    
    print("\n🎉 Model training complete!")
    print("   Model saved to: models/best_model.pth")
    print("   Scaler saved to: models/scaler.pkl")

if __name__ == "__main__":
    asyncio.run(main())

