"""
Advanced News Sentiment Analysis
"""
import os
import requests
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import numpy as np

class NewsSentimentAnalyzer:
    def __init__(self):
        self.marketaux_api_key = os.getenv("MARKETAUX_API_KEY")
        self.cache = {}
        self.cache_ttl = 300  # 5 minutes
        
        # Keywords for importance scoring
        self.critical_keywords = [
            "fed", "federal reserve", "interest rate", "powell",
            "inflation", "cpi", "employment", "jobs report",
            "recession", "gdp", "earnings", "guidance"
        ]
        
        self.positive_keywords = [
            "surge", "rally", "gain", "bullish", "upgrade", "beat",
            "strong", "growth", "profit", "optimistic", "recovery"
        ]
        
        self.negative_keywords = [
            "crash", "plunge", "bearish", "downgrade", "miss",
            "weak", "decline", "loss", "concern", "risk", "sell-off"
        ]

    async def analyze_sentiment(
        self,
        symbol: Optional[str] = None,
        hours_back: int = 24
    ) -> Dict:
        """
        Analyze market sentiment from recent news
        
        Returns:
            {
                "overall_score": float (-1 to 1),
                "confidence": float (0 to 1),
                "num_articles": int,
                "breakdown": {
                    "positive": int,
                    "neutral": int,
                    "negative": int
                },
                "key_themes": List[str],
                "momentum": float (-1 to 1)
            }
        """
        # Check cache
        cache_key = f"news_{symbol}_{hours_back}"
        if cache_key in self.cache:
            cached_data, cached_time = self.cache[cache_key]
            if (datetime.now() - cached_time).seconds < self.cache_ttl:
                return cached_data
        
        # Fetch news
        news_articles = await self._fetch_news(symbol, hours_back)
        
        if not news_articles:
            return self._default_sentiment()
        
        # Analyze each article
        analyzed_articles = []
        for article in news_articles:
            analysis = self._analyze_article(article)
            analyzed_articles.append(analysis)
        
        # Aggregate sentiment with time decay
        overall_score = self._calculate_weighted_sentiment(analyzed_articles)
        
        # Calculate confidence based on article count and consistency
        confidence = self._calculate_confidence(analyzed_articles)
        
        # Detect sentiment momentum (is it getting more positive/negative?)
        momentum = self._calculate_momentum(analyzed_articles)
        
        # Categorize articles
        breakdown = {
            "positive": sum(1 for a in analyzed_articles if a["sentiment_score"] > 0.2),
            "neutral": sum(1 for a in analyzed_articles if -0.2 <= a["sentiment_score"] <= 0.2),
            "negative": sum(1 for a in analyzed_articles if a["sentiment_score"] < -0.2)
        }
        
        # Extract key themes
        key_themes = self._extract_themes(analyzed_articles)
        
        result = {
            "overall_score": overall_score,
            "confidence": confidence,
            "num_articles": len(news_articles),
            "breakdown": breakdown,
            "key_themes": key_themes,
            "momentum": momentum,
            "last_updated": datetime.now().isoformat()
        }
        
        # Cache result
        self.cache[cache_key] = (result, datetime.now())
        
        return result

    async def _fetch_news(self, symbol: Optional[str], hours_back: int) -> List[Dict]:
        """Fetch news from Marketaux API"""
        if not self.marketaux_api_key:
            print("⚠ Warning: MARKETAUX_API_KEY not set")
            return []
        
        try:
            url = "https://api.marketaux.com/v1/news/all"
            params = {
                "api_token": self.marketaux_api_key,
                "language": "en",
                "limit": 50
            }
            
            if symbol:
                params["symbols"] = symbol
            else:
                # General market news
                params["symbols"] = "SPY,QQQ,DIA"
            
            # Filter by time
            published_after = datetime.now() - timedelta(hours=hours_back)
            params["published_after"] = published_after.strftime("%Y-%m-%dT%H:%M")
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            return data.get("data", [])
        
        except Exception as e:
            print(f"Error fetching news: {e}")
            return []

    def _analyze_article(self, article: Dict) -> Dict:
        """Analyze sentiment of a single article"""
        title = article.get("title", "").lower()
        description = article.get("description", "").lower()
        snippet = article.get("snippet", "").lower()
        
        full_text = f"{title} {description} {snippet}"
        
        # Keyword-based sentiment scoring
        positive_count = sum(1 for kw in self.positive_keywords if kw in full_text)
        negative_count = sum(1 for kw in self.negative_keywords if kw in full_text)
        
        # Sentiment score: -1 to 1
        if positive_count + negative_count > 0:
            sentiment_score = (positive_count - negative_count) / (positive_count + negative_count)
        else:
            # Use provider sentiment if available
            sentiment_score = article.get("sentiment_score", 0)
        
        # Importance scoring
        importance = self._calculate_importance(article, full_text)
        
        # Time relevance (newer = more important)
        time_weight = self._calculate_time_weight(article.get("published_at"))
        
        return {
            "title": article.get("title"),
            "sentiment_score": sentiment_score,
            "importance": importance,
            "time_weight": time_weight,
            "published_at": article.get("published_at"),
            "entities": article.get("entities", [])
        }

    def _calculate_importance(self, article: Dict, full_text: str) -> float:
        """Calculate article importance (0 to 1)"""
        importance = 0.5  # Base importance
        
        # Check for critical keywords
        critical_count = sum(1 for kw in self.critical_keywords if kw in full_text)
        importance += min(critical_count * 0.1, 0.3)
        
        # Check for high-quality source (if metadata available)
        # This would require a curated list of trusted sources
        
        # Check for multiple entities (more comprehensive article)
        entities = article.get("entities", [])
        if len(entities) > 3:
            importance += 0.1
        
        return min(importance, 1.0)

    def _calculate_time_weight(self, published_at: Optional[str]) -> float:
        """Calculate time decay weight (1.0 for now, decays over time)"""
        if not published_at:
            return 0.5
        
        try:
            published_time = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
            hours_ago = (datetime.now(published_time.tzinfo) - published_time).total_seconds() / 3600
            
            # Exponential decay: half-life of 6 hours
            decay = np.exp(-hours_ago / 6)
            return float(decay)
        
        except:
            return 0.5

    def _calculate_weighted_sentiment(self, articles: List[Dict]) -> float:
        """Calculate overall sentiment with importance and time weighting"""
        if not articles:
            return 0.0
        
        weighted_sum = 0.0
        weight_total = 0.0
        
        for article in articles:
            weight = article["importance"] * article["time_weight"]
            weighted_sum += article["sentiment_score"] * weight
            weight_total += weight
        
        if weight_total > 0:
            return weighted_sum / weight_total
        return 0.0

    def _calculate_confidence(self, articles: List[Dict]) -> float:
        """Calculate confidence in sentiment reading"""
        if not articles:
            return 0.0
        
        # More articles = higher confidence (up to a point)
        volume_confidence = min(len(articles) / 20, 1.0)
        
        # Consistency: how aligned are the sentiments?
        sentiments = [a["sentiment_score"] for a in articles]
        if len(sentiments) > 1:
            std_dev = np.std(sentiments)
            consistency_confidence = 1.0 - min(std_dev, 1.0)
        else:
            consistency_confidence = 0.5
        
        # Combined confidence
        return (volume_confidence + consistency_confidence) / 2

    def _calculate_momentum(self, articles: List[Dict]) -> float:
        """Calculate sentiment momentum (is it trending more positive/negative?)"""
        if len(articles) < 4:
            return 0.0
        
        # Sort by time
        sorted_articles = sorted(articles, key=lambda a: a.get("published_at", ""), reverse=True)
        
        # Compare recent half vs older half
        mid_point = len(sorted_articles) // 2
        recent_sentiment = np.mean([a["sentiment_score"] for a in sorted_articles[:mid_point]])
        older_sentiment = np.mean([a["sentiment_score"] for a in sorted_articles[mid_point:]])
        
        # Momentum is the difference
        return recent_sentiment - older_sentiment

    def _extract_themes(self, articles: List[Dict]) -> List[str]:
        """Extract key themes from articles"""
        themes = []
        
        # Count entity mentions
        entity_counts = {}
        for article in articles:
            for entity in article.get("entities", []):
                name = entity.get("name", "")
                if name:
                    entity_counts[name] = entity_counts.get(name, 0) + 1
        
        # Get top entities
        sorted_entities = sorted(entity_counts.items(), key=lambda x: x[1], reverse=True)
        themes = [entity for entity, count in sorted_entities[:5] if count >= 2]
        
        return themes

    def _default_sentiment(self) -> Dict:
        """Return default sentiment when no data available"""
        return {
            "overall_score": 0.0,
            "confidence": 0.0,
            "num_articles": 0,
            "breakdown": {"positive": 0, "neutral": 0, "negative": 0},
            "key_themes": [],
            "momentum": 0.0,
            "last_updated": datetime.now().isoformat()
        }

# Singleton instance
news_sentiment_analyzer = NewsSentimentAnalyzer()

