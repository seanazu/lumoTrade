"""
Social Sentiment Tracker (Twitter, Reddit, etc.)
"""
import os
import requests
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import numpy as np

class SocialSentimentTracker:
    def __init__(self):
        # For MVP, we'll use a simplified approach
        # In production, integrate with Twitter API v2, Reddit API, or sentiment aggregators
        self.cache = {}
        self.cache_ttl = 300  # 5 minutes
        
        # Keywords for sentiment detection
        self.bullish_keywords = [
            "bullish", "calls", "moon", "buy", "long", "rocket",
            "to the moon", "diamond hands", "hodl", "green", "gains"
        ]
        
        self.bearish_keywords = [
            "bearish", "puts", "short", "sell", "crash", "dump",
            "paper hands", "red", "loss", "bear", "decline"
        ]

    async def track_sentiment(
        self,
        symbol: str = "SPY",
        hours_back: int = 24
    ) -> Dict:
        """
        Track social sentiment for a symbol
        
        Returns:
            {
                "overall_score": float (-1 to 1),
                "confidence": float (0 to 1),
                "volume": int,
                "sentiment_breakdown": {
                    "bullish": int,
                    "neutral": int,
                    "bearish": int
                },
                "trending": bool,
                "momentum": float
            }
        """
        # Check cache
        cache_key = f"social_{symbol}_{hours_back}"
        if cache_key in self.cache:
            cached_data, cached_time = self.cache[cache_key]
            if (datetime.now() - cached_time).seconds < self.cache_ttl:
                return cached_data
        
        # For MVP: Use mock data based on market conditions
        # In production: Integrate real APIs
        result = await self._get_social_sentiment(symbol, hours_back)
        
        # Cache result
        self.cache[cache_key] = (result, datetime.now())
        
        return result

    async def _get_social_sentiment(self, symbol: str, hours_back: int) -> Dict:
        """
        Get social sentiment from various sources
        
        For MVP implementation, this returns a reasonable estimate.
        In production, integrate with:
        - Twitter API v2 (for $SPY mentions)
        - Reddit API (wallstreetbets, stocks subreddits)
        - StockTwits API
        - Alternative data providers (LunarCrush, Santiment)
        """
        
        # Option 1: Try to get data from a free social sentiment API
        # For now, we'll use a simplified heuristic approach
        
        try:
            # Check if there's a social sentiment provider configured
            # This is a placeholder for future integration
            
            # For MVP: Return neutral with low confidence
            # This ensures the model doesn't over-rely on unimplemented features
            return {
                "overall_score": 0.0,
                "confidence": 0.3,  # Low confidence since we're not using real data yet
                "volume": 0,
                "sentiment_breakdown": {
                    "bullish": 0,
                    "neutral": 0,
                    "bearish": 0
                },
                "trending": False,
                "momentum": 0.0,
                "last_updated": datetime.now().isoformat(),
                "note": "Social sentiment tracking not yet configured. Set up Twitter/Reddit APIs for real data."
            }
        
        except Exception as e:
            print(f"Error tracking social sentiment: {e}")
            return self._default_sentiment()

    async def _fetch_twitter_sentiment(self, symbol: str, hours_back: int) -> List[Dict]:
        """
        Fetch Twitter mentions (requires Twitter API v2)
        
        Setup:
        1. Apply for Twitter Developer account
        2. Get API bearer token
        3. Set TWITTER_BEARER_TOKEN env var
        """
        bearer_token = os.getenv("TWITTER_BEARER_TOKEN")
        if not bearer_token:
            return []
        
        try:
            # Twitter API v2 search endpoint
            url = "https://api.twitter.com/2/tweets/search/recent"
            query = f"${symbol} OR {symbol}"
            
            headers = {
                "Authorization": f"Bearer {bearer_token}"
            }
            
            params = {
                "query": query,
                "max_results": 100,
                "tweet.fields": "created_at,public_metrics,entities"
            }
            
            response = requests.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            return data.get("data", [])
        
        except Exception as e:
            print(f"Error fetching Twitter data: {e}")
            return []

    async def _fetch_reddit_sentiment(self, symbol: str, hours_back: int) -> List[Dict]:
        """
        Fetch Reddit mentions (requires Reddit API)
        
        Setup:
        1. Create Reddit app at https://www.reddit.com/prefs/apps
        2. Get client_id and client_secret
        3. Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET env vars
        """
        client_id = os.getenv("REDDIT_CLIENT_ID")
        client_secret = os.getenv("REDDIT_CLIENT_SECRET")
        
        if not (client_id and client_secret):
            return []
        
        try:
            # Get access token
            auth = requests.auth.HTTPBasicAuth(client_id, client_secret)
            data = {
                "grant_type": "client_credentials",
                "device_id": "lumotrade"
            }
            headers = {"User-Agent": "LumoTrade/1.0"}
            
            token_response = requests.post(
                "https://www.reddit.com/api/v1/access_token",
                auth=auth,
                data=data,
                headers=headers,
                timeout=10
            )
            token_response.raise_for_status()
            token = token_response.json()["access_token"]
            
            # Search subreddit
            headers["Authorization"] = f"Bearer {token}"
            search_url = "https://oauth.reddit.com/r/wallstreetbets/search"
            params = {
                "q": symbol,
                "restrict_sr": "on",
                "sort": "new",
                "limit": 100
            }
            
            response = requests.get(search_url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            posts = data.get("data", {}).get("children", [])
            return [post["data"] for post in posts]
        
        except Exception as e:
            print(f"Error fetching Reddit data: {e}")
            return []

    def _analyze_social_posts(self, posts: List[Dict]) -> float:
        """Analyze sentiment from social media posts"""
        if not posts:
            return 0.0
        
        sentiment_scores = []
        
        for post in posts:
            # Extract text
            text = ""
            if "text" in post:
                text = post["text"].lower()
            elif "title" in post:
                text = post["title"].lower()
            
            # Simple keyword-based sentiment
            bullish_count = sum(1 for kw in self.bullish_keywords if kw in text)
            bearish_count = sum(1 for kw in self.bearish_keywords if kw in text)
            
            if bullish_count + bearish_count > 0:
                score = (bullish_count - bearish_count) / (bullish_count + bearish_count)
                sentiment_scores.append(score)
        
        if sentiment_scores:
            return float(np.mean(sentiment_scores))
        return 0.0

    def _default_sentiment(self) -> Dict:
        """Return default sentiment when no data available"""
        return {
            "overall_score": 0.0,
            "confidence": 0.0,
            "volume": 0,
            "sentiment_breakdown": {
                "bullish": 0,
                "neutral": 0,
                "bearish": 0
            },
            "trending": False,
            "momentum": 0.0,
            "last_updated": datetime.now().isoformat()
        }

# Singleton instance
social_sentiment_tracker = SocialSentimentTracker()

