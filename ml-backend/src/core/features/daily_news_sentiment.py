"""
Daily News Sentiment Analysis
Real sentiment scoring with GPT-4 for market-moving news detection.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import os

# Try to import OpenAI
try:
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False


def analyze_daily_news_sentiment(
    news_df: pd.DataFrame,
    idx: pd.DatetimeIndex,
    ticker: str,
    use_llm: bool = True
) -> pd.DataFrame:
    """
    Analyze news sentiment per trading day with focus on market-moving events.
    
    Returns 10 powerful sentiment features per day:
    1. Sentiment score (-1 to +1)
    2. Market impact probability (0-1)
    3. News volume (count)
    4. Novelty score (how unexpected is the news)
    5. Source credibility weight
    6. Bearish keyword density
    7. Bullish keyword density
    8. Uncertainty score
    9. Event type (earnings, Fed, macro, etc.)
    10. Sentiment momentum (change vs yesterday)
    """
    
    features = pd.DataFrame(index=idx)
    
    # Initialize with neutral values
    features['news_sentiment_score'] = 0.0
    features['news_market_impact'] = 0.0
    features['news_volume'] = 0
    features['news_novelty'] = 0.0
    features['news_credibility'] = 0.5
    features['news_bearish_density'] = 0.0
    features['news_bullish_density'] = 0.0
    features['news_uncertainty'] = 0.0
    features['news_event_type'] = 0  # 0=none, 1=earnings, 2=Fed, 3=macro, 4=geopolitical
    features['news_sentiment_momentum'] = 0.0
    
    if news_df is None or len(news_df) == 0:
        return features
    
    # Group news by day
    if 'publishedDate' in news_df.columns:
        news_df = news_df.copy()
        news_df['date'] = pd.to_datetime(news_df['publishedDate']).dt.date
        
        for date in idx.date:
            date_news = news_df[news_df['date'] == date]
            
            if len(date_news) == 0:
                continue
            
            # Volume
            features.loc[features.index.date == date, 'news_volume'] = len(date_news)
            
            if use_llm and HAS_OPENAI:
                # Use GPT-4 for sophisticated analysis
                sentiment_result = _analyze_with_gpt4(date_news, ticker)
                
                for key, value in sentiment_result.items():
                    if key in features.columns:
                        features.loc[features.index.date == date, key] = value
            else:
                # Use advanced keyword-based analysis
                sentiment_result = _analyze_with_keywords(date_news, ticker)
                
                for key, value in sentiment_result.items():
                    if key in features.columns:
                        features.loc[features.index.date == date, key] = value
    
    # Calculate sentiment momentum (change from previous day)
    features['news_sentiment_momentum'] = features['news_sentiment_score'].diff()
    
    # Forward fill missing values
    features = features.ffill().fillna(0)
    
    return features


def _analyze_with_gpt4(news_df: pd.DataFrame, ticker: str) -> Dict[str, float]:
    """Use GPT-4o (latest model) to analyze news sentiment and market impact."""
    
    try:
        client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
        # Prepare news summary (take top 15 most recent headlines)
        headlines = news_df['title'].head(15).tolist()
        news_text = "\n".join([f"- {h}" for h in headlines])
        
        prompt = f"""You are an expert market analyst. Analyze these news headlines for {ticker} and predict market impact.

Headlines:
{news_text}

Provide EXACTLY 4 numbers separated by commas:
1. Sentiment (-1 to +1): -1=very bearish, 0=neutral, +1=very bullish
2. Market impact (0-1): probability this news will significantly move the stock price
3. Novelty (0-1): how unexpected/surprising is this news
4. Event type: 0=none, 1=earnings, 2=Fed/monetary policy, 3=macro/economic, 4=geopolitical

Consider:
- Source credibility
- Market context
- Historical similar events
- Sentiment momentum

Respond with ONLY the 4 numbers separated by commas:
sentiment,impact,novelty,event_type"""
        
        # Using GPT-5 as requested by user
        response = client.chat.completions.create(
            model="gpt-5",  # GPT-5 (latest release)
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,  # Very low for maximum consistency and accuracy
            max_tokens=50
        )
        
        result = response.choices[0].message.content.strip()
        values = [float(x.strip()) for x in result.split(',')]
        
        return {
            'news_sentiment_score': values[0],
            'news_market_impact': values[1],
            'news_novelty': values[2],
            'news_event_type': int(values[3]),
            'news_credibility': 0.9  # GPT-4 analysis is high credibility
        }
        
    except Exception as e:
        print(f"GPT-4 analysis failed: {e}")
        return _analyze_with_keywords(news_df, ticker)


def _analyze_with_keywords(news_df: pd.DataFrame, ticker: str) -> Dict[str, float]:
    """Advanced keyword-based sentiment analysis."""
    
    # Combine title and text
    text = ' '.join(news_df['title'].fillna('') + ' ' + news_df['text'].fillna('')).lower()
    
    # Bullish keywords (weighted by importance)
    bullish_keywords = {
        'surge': 3, 'rally': 3, 'soar': 3, 'breakthrough': 3,
        'beat': 2, 'exceed': 2, 'growth': 2, 'gain': 2, 'rise': 2, 'up': 1,
        'positive': 2, 'bullish': 3, 'optimistic': 2, 'strong': 2,
        'upgrade': 3, 'buy': 2, 'outperform': 3
    }
    
    # Bearish keywords (weighted)
    bearish_keywords = {
        'crash': 3, 'plunge': 3, 'collapse': 3, 'crisis': 3,
        'miss': 2, 'fall': 2, 'drop': 2, 'decline': 2, 'loss': 2, 'down': 1,
        'negative': 2, 'bearish': 3, 'pessimistic': 2, 'weak': 2,
        'downgrade': 3, 'sell': 2, 'underperform': 3
    }
    
    # Uncertainty keywords
    uncertainty_keywords = {
        'uncertain': 2, 'volatility': 2, 'risk': 1, 'caution': 2,
        'concern': 2, 'worry': 2, 'fear': 2, 'unknown': 2
    }
    
    # Market-moving event keywords
    event_keywords = {
        'earnings': 1, 'fed': 2, 'powell': 2, 'interest rate': 2,
        'inflation': 2, 'gdp': 2, 'unemployment': 2, 'cpi': 2,
        'war': 4, 'sanction': 4, 'trade': 3, 'tariff': 3
    }
    
    # Calculate scores
    bullish_score = sum(weight * text.count(word) for word, weight in bullish_keywords.items())
    bearish_score = sum(weight * text.count(word) for word, weight in bearish_keywords.items())
    uncertainty_score = sum(weight * text.count(word) for word, weight in uncertainty_keywords.items())
    event_score = sum(weight * text.count(word) for word, weight in event_keywords.items())
    
    total_keywords = bullish_score + bearish_score + 1e-6
    
    # Sentiment score (-1 to +1)
    sentiment = (bullish_score - bearish_score) / (bullish_score + bearish_score + 10)
    
    # Market impact (based on event keywords and article count)
    impact = min(1.0, (event_score * 0.1 + len(news_df) * 0.01))
    
    # Novelty (higher if unusual keywords present)
    novelty = min(1.0, event_score * 0.15)
    
    # Event type detection
    event_type = 0
    if 'earnings' in text or 'eps' in text:
        event_type = 1
    elif 'fed' in text or 'powell' in text or 'interest rate' in text:
        event_type = 2
    elif 'gdp' in text or 'inflation' in text or 'unemployment' in text:
        event_type = 3
    elif 'war' in text or 'sanction' in text or 'geopolitical' in text:
        event_type = 4
    
    # Source credibility (based on known sources)
    credibility = 0.5
    if any(source in text for source in ['wsj', 'bloomberg', 'reuters', 'financial times']):
        credibility = 0.9
    elif any(source in text for source in ['cnbc', 'marketwatch', 'yahoo finance']):
        credibility = 0.7
    
    return {
        'news_sentiment_score': sentiment,
        'news_market_impact': impact,
        'news_novelty': novelty,
        'news_event_type': event_type,
        'news_credibility': credibility,
        'news_bearish_density': bearish_score / total_keywords,
        'news_bullish_density': bullish_score / total_keywords,
        'news_uncertainty': min(1.0, uncertainty_score * 0.1)
    }


def detect_market_regime(ohlcv: pd.DataFrame, idx: pd.DatetimeIndex) -> pd.DataFrame:
    """
    Detect market regime for better prediction filtering.
    Trade only in predictable regimes.
    """
    features = pd.DataFrame(index=idx)
    
    close = ohlcv['close'] if 'close' in ohlcv.columns else ohlcv['Close']
    
    # Trend regime (bull, bear, sideways)
    sma_50 = close.rolling(50).mean()
    sma_200 = close.rolling(200).mean()
    
    features['regime_trend'] = 0  # 0=sideways, 1=bull, -1=bear
    features.loc[close > sma_50, 'regime_trend'] = 1
    features.loc[close < sma_50, 'regime_trend'] = -1
    
    # Volatility regime (low, medium, high)
    volatility = close.pct_change().rolling(20).std() * np.sqrt(252)
    vol_median = volatility.rolling(100).median()
    
    features['regime_volatility'] = 0  # 0=normal, 1=high, -1=low
    features.loc[volatility > vol_median * 1.5, 'regime_volatility'] = 1
    features.loc[volatility < vol_median * 0.5, 'regime_volatility'] = -1
    
    # Volume regime (normal, high, low)
    volume = ohlcv['volume']
    vol_ma = volume.rolling(20).mean()
    
    features['regime_volume'] = 0
    features.loc[volume > vol_ma * 1.5, 'regime_volume'] = 1
    features.loc[volume < vol_ma * 0.5, 'regime_volume'] = -1
    
    # Market efficiency (how predictable is it)
    # High autocorrelation = more predictable
    returns = close.pct_change()
    autocorr = returns.rolling(20).apply(lambda x: x.autocorr() if len(x) > 2 else 0, raw=False)
    
    features['regime_predictability'] = autocorr.fillna(0)
    
    # Trading recommendation: Only trade in favorable regimes
    # Favorable = trending market + normal/high volatility + predictable
    features['regime_tradeable'] = (
        (features['regime_trend'].abs() > 0) &  # Trending (not sideways)
        (features['regime_volatility'] >= 0) &  # Normal or high vol (not low)
        (features['regime_predictability'].abs() > 0.1)  # Some predictability
    ).astype(int)
    
    return features.ffill().fillna(0)


def create_event_calendar_features(idx: pd.DatetimeIndex) -> pd.DataFrame:
    """
    Create features for known market-moving events.
    """
    features = pd.DataFrame(index=idx)
    
    # Day of week (Monday/Friday different from mid-week)
    features['is_monday'] = (idx.dayofweek == 0).astype(int)
    features['is_friday'] = (idx.dayofweek == 4).astype(int)
    
    # Month effects
    features['is_january'] = (idx.month == 1).astype(int)  # January effect
    features['is_december'] = (idx.month == 12).astype(int)  # Year-end rally
    features['is_september'] = (idx.month == 9).astype(int)  # Worst month historically
    
    # FOMC meeting days (approximate - 8 times per year, roughly every 6 weeks)
    # In reality, you'd want to fetch actual FOMC dates
    features['potential_fomc_week'] = ((idx.isocalendar().week % 6) == 0).astype(int)
    
    # Earnings season (typically Jan, Apr, Jul, Oct)
    features['earnings_season'] = idx.month.isin([1, 4, 7, 10]).astype(int)
    
    # Options expiration (3rd Friday of each month)
    features['options_expiry_week'] = (
        (idx.dayofweek == 4) &  # Friday
        (idx.day >= 15) &  # 3rd week or later
        (idx.day <= 21)  # But not 4th week
    ).astype(int)
    
    return features

