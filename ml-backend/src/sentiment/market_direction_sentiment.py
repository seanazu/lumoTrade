"""
Market-Direction Sentiment Pipeline
Aggregates news from multiple sources to predict market direction (SPX, NDX, RUT)
"""
import os
import requests
import numpy as np
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from collections import defaultdict
import hashlib
import pytz
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class MarketDirectionSentiment:
    """
    Multi-source sentiment pipeline for market direction prediction
    Supports: SPX, NDX, RUT (and ETFs: SPY, QQQ, IWM)
    """
    
    def __init__(self):
        # API Keys
        self.fmp_key = os.getenv("FMP_API_KEY")
        self.marketaux_key = os.getenv("MARKETAUX_API_KEY")
        self.polygon_key = os.getenv("POLYGON_API_KEY")
        
        # Index configuration
        self.indices = {
            "SPX": {
                "etf": "SPY",
                "ticker": "^GSPC",
                "name": "S&P 500",
                "top_components": ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "BRK.B", "UNH", "JNJ"]
            },
            "NDX": {
                "etf": "QQQ",
                "ticker": "^NDX",
                "name": "NASDAQ 100",
                "top_components": ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "AVGO", "COST", "ADBE"]
            },
            "RUT": {
                "etf": "IWM",
                "ticker": "^RUT",
                "name": "Russell 2000",
                "top_components": []  # Small caps, less focused
            }
        }
        
        # Macro keywords for importance scoring
        self.macro_keywords = [
            "federal reserve", "fed", "powell", "interest rate", "inflation", "cpi",
            "employment", "jobs report", "nfp", "recession", "gdp", "treasury",
            "yield", "bond", "fomc", "monetary policy", "rate hike", "rate cut"
        ]
        
        # Source tier mapping (for importance scoring)
        self.source_tiers = {
            "bloomberg": 1.0,
            "reuters": 1.0,
            "wsj": 1.0,
            "wall street journal": 1.0,
            "financial times": 0.9,
            "cnbc": 0.8,
            "marketwatch": 0.7,
            "seeking alpha": 0.6,
            "yahoo finance": 0.6,
            "benzinga": 0.5,
            "default": 0.3
        }
        
        # Cache
        self.cache = {}
        self.cache_ttl = 300  # 5 minutes
        
        # Event clustering
        self.vectorizer = TfidfVectorizer(max_features=100, stop_words='english')
        
    async def analyze_market_direction(
        self,
        index: str = "SPX",
        horizon: str = "T+1",
        cutoff_minutes: int = 30
    ) -> Dict:
        """
        Main entry point: analyze market direction sentiment
        
        Args:
            index: SPX, NDX, or RUT
            horizon: T+1 (next day), T+3 (3-day), T+5 (5-day)
            cutoff_minutes: minutes before market close to use as cutoff
            
        Returns:
            {
                "index": str,
                "horizon": str,
                "sentiment_weighted_mean": float (-1 to 1),
                "sentiment_weighted_median": float,
                "sentiment_std": float,
                "neg_extreme_share": float,
                "pos_extreme_share": float,
                "event_count": int,
                "hi_imp_event_count": int,
                "macro_event_count": int,
                "sentiment_shock": float,
                "social_sentiment_delta": float,
                "confidence": float,
                "timestamp": str
            }
        """
        print(f"\n{'='*80}")
        print(f"📊 MARKET DIRECTION SENTIMENT ANALYSIS")
        print(f"Index: {index} | Horizon: {horizon}")
        print(f"{'='*80}\n")
        
        # 1. Fetch news from all sources
        print("📰 Step 1: Fetching news from multiple sources...")
        articles = await self._fetch_all_news(index, cutoff_minutes)
        print(f"   ✅ Fetched {len(articles)} articles\n")
        
        if not articles:
            return self._default_sentiment(index, horizon)
        
        # 2. Normalize and tag articles
        print("🏷️  Step 2: Normalizing and tagging articles...")
        normalized = self._normalize_articles(articles, index)
        print(f"   ✅ Normalized {len(normalized)} articles\n")
        
        # 3. De-duplicate and cluster into events
        print("🔗 Step 3: Clustering articles into events...")
        events = self._cluster_into_events(normalized, index)
        print(f"   ✅ Created {len(events)} unique events\n")
        
        # 4. Compute event-level sentiment and importance
        print("⚖️  Step 4: Computing sentiment and importance...")
        scored_events = self._score_events(events)
        print(f"   ✅ Scored {len(scored_events)} events\n")
        
        # 5. Build daily sentiment features
        print("📈 Step 5: Building sentiment features...")
        features = self._build_sentiment_features(scored_events, index)
        print(f"   ✅ Generated {len(features)} features\n")
        
        # 6. Add social sentiment (if available)
        print("💬 Step 6: Adding social sentiment...")
        social_features = await self._fetch_social_sentiment(index)
        features.update(social_features)
        print(f"   ✅ Added social features\n")
        
        print(f"{'='*80}")
        print(f"✅ ANALYSIS COMPLETE")
        print(f"   Sentiment: {features['sentiment_weighted_mean']:.3f}")
        print(f"   Confidence: {features['confidence']:.2f}")
        print(f"   Events: {features['event_count']} ({features['hi_imp_event_count']} high-importance)")
        print(f"{'='*80}\n")
        
        return features
    
    async def _fetch_all_news(self, index: str, cutoff_minutes: int) -> List[Dict]:
        """Fetch news from FMP, Marketaux, and Polygon"""
        all_articles = []
        
        # Calculate cutoff time (e.g., 30 min before market close) - make it timezone-aware
        cutoff_time = datetime.now(pytz.UTC) - timedelta(minutes=cutoff_minutes)
        
        # Get index config
        config = self.indices.get(index, self.indices["SPX"])
        symbols = [config["etf"]] + config["top_components"][:5]  # ETF + top 5 components
        
        # Fetch from FMP
        try:
            fmp_articles = await self._fetch_fmp_news(symbols, cutoff_time)
            all_articles.extend(fmp_articles)
            print(f"   📊 FMP: {len(fmp_articles)} articles")
        except Exception as e:
            print(f"   ⚠️  FMP error: {e}")
        
        # Fetch from Marketaux
        try:
            marketaux_articles = await self._fetch_marketaux_news(symbols, cutoff_time)
            all_articles.extend(marketaux_articles)
            print(f"   📰 Marketaux: {len(marketaux_articles)} articles")
        except Exception as e:
            print(f"   ⚠️  Marketaux error: {e}")
        
        # Fetch from Polygon
        try:
            polygon_articles = await self._fetch_polygon_news(symbols, cutoff_time)
            all_articles.extend(polygon_articles)
            print(f"   🔷 Polygon: {len(polygon_articles)} articles")
        except Exception as e:
            print(f"   ⚠️  Polygon error: {e}")
        
        return all_articles
    
    async def _fetch_fmp_news(self, symbols: List[str], cutoff_time: datetime) -> List[Dict]:
        """Fetch news from FMP"""
        if not self.fmp_key:
            return []
        
        articles = []
        url = "https://financialmodelingprep.com/api/v3/stock_news"
        
        for symbol in symbols[:3]:  # Limit to avoid rate limits
            try:
                params = {
                    "tickers": symbol,
                    "limit": 20,
                    "apikey": self.fmp_key
                }
                response = requests.get(url, params=params, timeout=10)
                response.raise_for_status()
                data = response.json()
                
                for item in data:
                    try:
                        pub_time_str = item.get("publishedDate", "")
                        if not pub_time_str:
                            continue
                        
                        # Parse and ensure timezone-aware
                        pub_time = datetime.fromisoformat(pub_time_str.replace("Z", "+00:00"))
                        if pub_time.tzinfo is None:
                            pub_time = pytz.UTC.localize(pub_time)
                        
                        if pub_time <= cutoff_time:
                            articles.append({
                                "provider": "fmp",
                                "headline": item.get("title", ""),
                                "summary": item.get("text", ""),
                                "published_at": pub_time,
                                "source": item.get("site", ""),
                                "url": item.get("url", ""),
                                "tickers": [symbol],
                                "sentiment_raw": None  # FMP doesn't provide sentiment
                            })
                    except Exception as e:
                        # Skip articles with parsing errors
                        continue
            except Exception as e:
                print(f"     Error fetching FMP news for {symbol}: {e}")
                continue
        
        return articles
    
    async def _fetch_marketaux_news(self, symbols: List[str], cutoff_time: datetime) -> List[Dict]:
        """Fetch news from Marketaux with entity sentiment"""
        if not self.marketaux_key:
            return []
        
        articles = []
        url = "https://api.marketaux.com/v1/news/all"
        
        try:
            params = {
                "api_token": self.marketaux_key,
                "symbols": ",".join(symbols[:5]),
                "entity_types": "index,equity",
                "group_similar": "true",
                "must_have_entities": "true",
                "language": "en",
                "limit": 50,
                "published_after": (cutoff_time - timedelta(hours=24)).strftime("%Y-%m-%dT%H:%M")
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            for item in data.get("data", []):
                try:
                    pub_time_str = item.get("published_at", "")
                    if not pub_time_str:
                        continue
                    
                    # Parse and ensure timezone-aware
                    pub_time = datetime.fromisoformat(pub_time_str.replace("Z", "+00:00"))
                    if pub_time.tzinfo is None:
                        pub_time = pytz.UTC.localize(pub_time)
                    
                    if pub_time <= cutoff_time:
                        # Extract entity sentiments
                        entities = item.get("entities", [])
                        avg_sentiment = np.mean([e.get("sentiment_score", 0) for e in entities]) if entities else 0
                        
                        articles.append({
                            "provider": "marketaux",
                            "headline": item.get("title", ""),
                            "summary": item.get("description", ""),
                            "published_at": pub_time,
                            "source": item.get("source", ""),
                            "url": item.get("url", ""),
                            "tickers": [e.get("symbol") for e in entities],
                            "entities": entities,
                            "sentiment_raw": avg_sentiment,  # -1 to 1
                            "similar_count": len(item.get("similar", []))
                        })
                except Exception as e:
                    print(f"     Error parsing Marketaux article: {e}")
                    continue
        except Exception as e:
            print(f"     Error fetching Marketaux news: {e}")
        
        return articles
    
    async def _fetch_polygon_news(self, symbols: List[str], cutoff_time: datetime) -> List[Dict]:
        """Fetch news from Polygon"""
        if not self.polygon_key:
            return []
        
        articles = []
        
        for symbol in symbols[:3]:
            try:
                url = f"https://api.polygon.io/v2/reference/news"
                params = {
                    "ticker": symbol,
                    "limit": 20,
                    "apiKey": self.polygon_key
                }
                
                response = requests.get(url, params=params, timeout=10)
                response.raise_for_status()
                data = response.json()
                
                for item in data.get("results", []):
                    try:
                        pub_time_str = item.get("published_utc", "")
                        if not pub_time_str:
                            continue
                        
                        # Parse and ensure timezone-aware
                        pub_time = datetime.fromisoformat(pub_time_str.replace("Z", "+00:00"))
                        if pub_time.tzinfo is None:
                            pub_time = pytz.UTC.localize(pub_time)
                        
                        if pub_time <= cutoff_time:
                            articles.append({
                                "provider": "polygon",
                                "headline": item.get("title", ""),
                                "summary": item.get("description", ""),
                                "published_at": pub_time,
                                "source": item.get("publisher", {}).get("name", ""),
                                "url": item.get("article_url", ""),
                                "tickers": item.get("tickers", []),
                                "sentiment_raw": None  # Polygon doesn't provide sentiment in free tier
                            })
                    except Exception as e:
                        # Skip articles with parsing errors
                        continue
            except Exception as e:
                print(f"     Error fetching Polygon news for {symbol}: {e}")
                continue
        
        return articles
    
    def _normalize_articles(self, articles: List[Dict], index: str) -> List[Dict]:
        """Normalize articles into common schema and tag with index"""
        normalized = []
        
        for article in articles:
            # Normalize sentiment to -1..1 scale
            sentiment = article.get("sentiment_raw")
            if sentiment is not None:
                # Already in -1..1 range (Marketaux)
                sentiment_normalized = float(sentiment)
            else:
                # Compute basic sentiment from keywords
                sentiment_normalized = self._compute_keyword_sentiment(
                    article.get("headline", "") + " " + article.get("summary", "")
                )
            
            # Tag with relevant indices
            relevant_indices = self._tag_indices(article, index)
            
            # Check for macro relevance
            text = (article.get("headline", "") + " " + article.get("summary", "")).lower()
            macro_relevance = any(keyword in text for keyword in self.macro_keywords)
            
            normalized.append({
                "id": hashlib.md5(article.get("url", str(article)).encode()).hexdigest(),
                "provider": article.get("provider"),
                "headline": article.get("headline"),
                "summary": article.get("summary"),
                "published_at": article.get("published_at"),
                "source": article.get("source", "").lower(),
                "url": article.get("url"),
                "tickers": article.get("tickers", []),
                "entities": article.get("entities", []),
                "sentiment": sentiment_normalized,
                "relevant_indices": relevant_indices,
                "macro_relevance": macro_relevance,
                "similar_count": article.get("similar_count", 0)
            })
        
        return normalized
    
    def _tag_indices(self, article: Dict, target_index: str) -> List[str]:
        """Tag article with relevant indices"""
        indices = []
        config = self.indices.get(target_index, self.indices["SPX"])
        
        # Check if article mentions index ETF or components
        tickers = article.get("tickers", [])
        if config["etf"] in tickers or any(comp in tickers for comp in config["top_components"]):
            indices.append(target_index)
        
        # Check headline/summary for index mentions
        text = (article.get("headline", "") + " " + article.get("summary", "")).lower()
        if config["name"].lower() in text or config["etf"].lower() in text:
            indices.append(target_index)
        
        return indices if indices else [target_index]  # Default to target
    
    def _compute_keyword_sentiment(self, text: str) -> float:
        """Compute basic sentiment from keywords"""
        text = text.lower()
        
        positive_keywords = [
            "surge", "rally", "gain", "bullish", "upgrade", "beat", "strong",
            "growth", "profit", "optimistic", "recovery", "soar", "jump"
        ]
        negative_keywords = [
            "crash", "plunge", "bearish", "downgrade", "miss", "weak", "decline",
            "loss", "concern", "risk", "sell-off", "tumble", "slump", "fall"
        ]
        
        pos_count = sum(1 for kw in positive_keywords if kw in text)
        neg_count = sum(1 for kw in negative_keywords if kw in text)
        
        total = pos_count + neg_count
        if total == 0:
            return 0.0
        
        return (pos_count - neg_count) / total
    
    def _cluster_into_events(self, articles: List[Dict], index: str) -> List[Dict]:
        """Cluster similar articles into events"""
        if not articles:
            return []
        
        # Filter for target index
        relevant = [a for a in articles if index in a["relevant_indices"]]
        
        if not relevant:
            return []
        
        # Use headline similarity for clustering
        headlines = [a["headline"] for a in relevant]
        
        try:
            # Compute TF-IDF similarity
            tfidf_matrix = self.vectorizer.fit_transform(headlines)
            similarity_matrix = cosine_similarity(tfidf_matrix)
            
            # Simple clustering: group articles with similarity > 0.6
            clustered = []
            used = set()
            
            for i, article in enumerate(relevant):
                if i in used:
                    continue
                
                # Find similar articles
                similar_indices = [j for j in range(len(relevant)) 
                                 if j not in used and similarity_matrix[i][j] > 0.6]
                
                # Create event
                event_articles = [relevant[j] for j in similar_indices]
                used.update(similar_indices)
                
                clustered.append({
                    "event_id": hashlib.md5(f"{article['headline']}{article['published_at']}".encode()).hexdigest(),
                    "indices": [index],
                    "start_time": min(a["published_at"] for a in event_articles),
                    "main_headline": article["headline"],
                    "articles": event_articles,
                    "article_count": len(event_articles)
                })
            
            return clustered
            
        except Exception as e:
            print(f"     Clustering error: {e}, using individual articles as events")
            # Fallback: each article is its own event
            return [{
                "event_id": a["id"],
                "indices": a["relevant_indices"],
                "start_time": a["published_at"],
                "main_headline": a["headline"],
                "articles": [a],
                "article_count": 1
            } for a in relevant]
    
    def _score_events(self, events: List[Dict]) -> List[Dict]:
        """Compute sentiment and importance for each event"""
        scored = []
        
        for event in events:
            articles = event["articles"]
            
            # Compute event sentiment (weighted average)
            sentiments = [a["sentiment"] for a in articles if a["sentiment"] is not None]
            if not sentiments:
                event_sentiment = 0.0
            else:
                # Weight by provider (Marketaux higher)
                weights = [2.0 if a["provider"] == "marketaux" else 1.0 for a in articles]
                event_sentiment = np.average(sentiments, weights=weights[:len(sentiments)])
            
            # Compute importance
            importance = self._compute_importance(event, articles)
            
            scored.append({
                **event,
                "sentiment": float(event_sentiment),
                "importance": float(importance),
                "macro_event": any(a.get("macro_relevance", False) for a in articles)
            })
        
        return scored
    
    def _compute_importance(self, event: Dict, articles: List[Dict]) -> float:
        """Compute event importance score (0-1)"""
        # Coverage score
        coverage_score = np.log1p(event["article_count"]) / 5.0  # Normalize
        
        # Source tier (average)
        source_tiers = []
        for article in articles:
            source = article.get("source", "").lower()
            tier = next((v for k, v in self.source_tiers.items() if k in source), 
                       self.source_tiers["default"])
            source_tiers.append(tier)
        avg_source_tier = np.mean(source_tiers) if source_tiers else 0.3
        
        # Macro relevance
        macro_score = 1.0 if any(a.get("macro_relevance") for a in articles) else 0.3
        
        # Recency (within last 24 hours)
        now = datetime.now(pytz.UTC)
        event_time = event["start_time"]
        # Ensure event_time is timezone-aware
        if event_time.tzinfo is None:
            event_time = pytz.UTC.localize(event_time)
        hours_ago = (now - event_time).total_seconds() / 3600
        recency_score = np.exp(-hours_ago / 24.0)  # Exponential decay
        
        # Weighted combination
        importance = (
            0.3 * coverage_score +
            0.3 * avg_source_tier +
            0.3 * macro_score +
            0.1 * recency_score
        )
        
        return min(1.0, importance)
    
    def _build_sentiment_features(self, events: List[Dict], index: str) -> Dict:
        """Build daily sentiment features from events"""
        if not events:
            return self._default_sentiment(index, "T+1")
        
        # Extract sentiments and importances
        sentiments = np.array([e["sentiment"] for e in events])
        importances = np.array([e["importance"] for e in events])
        
        # Weighted statistics
        sentiment_weighted_mean = np.average(sentiments, weights=importances)
        sentiment_weighted_median = np.median(sentiments)  # Can't weight median easily
        sentiment_std = np.sqrt(np.average((sentiments - sentiment_weighted_mean)**2, weights=importances))
        
        # Extreme shares
        neg_extreme_share = np.sum(sentiments < -0.6) / len(sentiments)
        pos_extreme_share = np.sum(sentiments > 0.6) / len(sentiments)
        
        # Event counts
        event_count = len(events)
        hi_imp_event_count = np.sum(importances > 0.7)
        macro_event_count = sum(1 for e in events if e.get("macro_event", False))
        
        # Sentiment shock (vs baseline)
        # TODO: Implement rolling baseline from historical data
        sentiment_shock = 0.0  # Placeholder
        
        # Confidence (based on event count and importance)
        confidence = min(1.0, (event_count / 20.0) * np.mean(importances))
        
        return {
            "index": index,
            "horizon": "T+1",  # Default
            "sentiment_weighted_mean": float(sentiment_weighted_mean),
            "sentiment_weighted_median": float(sentiment_weighted_median),
            "sentiment_std": float(sentiment_std),
            "neg_extreme_share": float(neg_extreme_share),
            "pos_extreme_share": float(pos_extreme_share),
            "event_count": int(event_count),
            "hi_imp_event_count": int(hi_imp_event_count),
            "macro_event_count": int(macro_event_count),
            "sentiment_shock": float(sentiment_shock),
            "confidence": float(confidence),
            "timestamp": datetime.now(pytz.UTC).isoformat()
        }
    
    async def _fetch_social_sentiment(self, index: str) -> Dict:
        """Fetch social sentiment from FMP"""
        if not self.fmp_key:
            return {
                "social_sentiment_delta": 0.0,
                "social_volume_ratio": 1.0
            }
        
        try:
            config = self.indices.get(index, self.indices["SPX"])
            url = f"https://financialmodelingprep.com/api/v4/historical/social-sentiment"
            params = {
                "symbol": config["etf"],
                "apikey": self.fmp_key
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data and len(data) >= 2:
                today = data[0]
                yesterday = data[1]
                
                social_sentiment_delta = today.get("sentiment", 0) - yesterday.get("sentiment", 0)
                social_volume_ratio = today.get("absoluteIndex", 1) / max(yesterday.get("absoluteIndex", 1), 1)
                
                return {
                    "social_sentiment_delta": float(social_sentiment_delta),
                    "social_volume_ratio": float(social_volume_ratio)
                }
        except Exception as e:
            print(f"     Social sentiment error: {e}")
        
        return {
            "social_sentiment_delta": 0.0,
            "social_volume_ratio": 1.0
        }
    
    def _default_sentiment(self, index: str, horizon: str) -> Dict:
        """Return default sentiment when no data available"""
        return {
            "index": index,
            "horizon": horizon,
            "sentiment_weighted_mean": 0.0,
            "sentiment_weighted_median": 0.0,
            "sentiment_std": 0.0,
            "neg_extreme_share": 0.0,
            "pos_extreme_share": 0.0,
            "event_count": 0,
            "hi_imp_event_count": 0,
            "macro_event_count": 0,
            "sentiment_shock": 0.0,
            "social_sentiment_delta": 0.0,
            "social_volume_ratio": 1.0,
            "confidence": 0.0,
            "timestamp": datetime.now(pytz.UTC).isoformat()
        }


# Global instance
market_direction_sentiment = MarketDirectionSentiment()

