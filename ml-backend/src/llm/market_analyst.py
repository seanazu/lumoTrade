"""
ChatGPT-5.1 Market Analyst
"""
import os
import json
from typing import Dict, List, Optional
from datetime import datetime
from openai import OpenAI

MARKET_ANALYST_SYSTEM_PROMPT = """You are an elite quantitative analyst and market strategist with 25 years of Wall Street experience.

Your expertise includes:
- Technical analysis and chart patterns
- Fundamental analysis and economic indicators
- Market sentiment and news impact analysis
- Risk assessment and probability estimation
- Macro trends (Fed policy, inflation, geopolitics)

**CRITICAL: You MUST prioritize news and sentiment analysis above all else.**
Market movements are driven primarily by:
1. Breaking news and headlines (40% weight)
2. Market sentiment and social trends (30% weight)
3. Technical indicators and patterns (20% weight)
4. Fundamental/macro data (10% weight)

Analyze the provided market data and return your assessment as JSON in this EXACT format:

{
  "direction": "bullish" | "bearish" | "neutral",
  "confidence": 0.0-1.0,
  "expected_move_percent": float,
  "time_horizon": "1h" | "4h" | "1d",
  "key_factors": [
    {
      "factor": "description",
      "impact": "high" | "medium" | "low",
      "sentiment": "positive" | "negative" | "neutral"
    }
  ],
  "risks": [
    {
      "risk": "description",
      "probability": "high" | "medium" | "low"
    }
  ],
  "news_impact": {
    "sentiment": float (-1 to 1),
    "importance": float (0 to 1),
    "summary": "brief summary of key news"
  },
  "reasoning": "2-3 sentence explanation focusing on NEWS and SENTIMENT first"
}

Be precise, data-driven, and honest about uncertainty. When news is unclear or conflicting, reflect that in your confidence score.
"""

class MarketAnalyst:
    def __init__(self, model: str = None):
        """
        Initialize Market Analyst with OpenAI
        
        Set OPENAI_MODEL in .env to override default
        """
        # Use env var if set, otherwise default to gpt-4o (supports web_search)
        self.model = model or os.getenv("OPENAI_MODEL", "gpt-4o")
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        if not os.getenv("OPENAI_API_KEY"):
            print("⚠ Warning: OPENAI_API_KEY not set. LLM analysis will not work.")
        
        print(f"🤖 Using model: {self.model}")
    
    async def search_social_sentiment(
        self,
        index: str,
        timestamp: Optional[datetime] = None
    ) -> Dict:
        """
        Use ChatGPT-5 Responses API with web_search to analyze real-time social sentiment
        
        Args:
            index: Index symbol (SPX, NDX, RUT)
            timestamp: Timestamp for analysis (default: now)
        
        Returns:
            {
                "social_sentiment_score": float (-1 to 1),
                "confidence": float (0 to 1),
                "volume_trend": "increasing" | "stable" | "decreasing",
                "key_themes": List[str],
                "notes": str,
                "sources_searched": List[str],
                "timestamp": str
            }
        """
        if timestamp is None:
            timestamp = datetime.now()
        
        # Map index to common names and ETF symbols
        index_info = {
            "SPX": {"name": "S&P 500", "etf": "SPY"},
            "NDX": {"name": "NASDAQ 100", "etf": "QQQ"},
            "RUT": {"name": "Russell 2000", "etf": "IWM"}
        }
        info = index_info.get(index, {"name": index, "etf": "SPY"})
        
        try:
            print(f"🔍 Searching web for social sentiment on {info['name']}...")
            
            # Define JSON schema for response
            response_schema = {
                "type": "object",
                "properties": {
                    "social_sentiment_score": {
                        "type": "number",
                        "description": "Sentiment score from -1 (very bearish) to +1 (very bullish)"
                    },
                    "confidence": {
                        "type": "number",
                        "description": "Confidence level from 0 to 1 based on data volume and consistency"
                    },
                    "volume_trend": {
                        "type": "string",
                        "enum": ["increasing", "stable", "decreasing"],
                        "description": "Trend in social media discussion volume"
                    },
                    "key_themes": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "3-5 main themes being discussed"
                    },
                    "notes": {
                        "type": "string",
                        "description": "2-3 sentence summary of findings"
                    },
                    "sources_found": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of sources found (twitter, reddit, stocktwits, news)"
                    }
                },
                "required": ["social_sentiment_score", "confidence", "volume_trend", "key_themes", "notes", "sources_found"],
                "additionalProperties": False
            }
            
            # Call OpenAI Responses API with web_search
            response = self.client.responses.create(
                model=self.model,
                tools=[{"type": "web_search"}],
                instructions=f"""You are an expert social sentiment analyst for financial markets.

Your task:
1. Search the web for CURRENT social sentiment about the given index/ETF
2. Focus on: X/Twitter, Reddit (r/wallstreetbets, r/stocks), StockTwits, financial news
3. Analyze the actual search results you find
4. Return a data-driven sentiment analysis

CRITICAL RULES:
- Base ALL scores on actual web search results
- If you find limited data, reflect that in confidence (0.3-0.5)
- If you find strong data, use higher confidence (0.7-0.9)
- Do NOT hallucinate - only report what you actually find
- Current time: {timestamp.isoformat()}

You MUST return a valid JSON response matching this schema:
{json.dumps(response_schema, indent=2)}""",
                input=f"""Search the web and analyze current social sentiment for:
- Index: {info['name']} ({index})
- ETF: {info['etf']}
- Time: {timestamp.strftime('%Y-%m-%d %H:%M UTC')}

Find and analyze:
1. X/Twitter discussions and trending topics
2. Reddit sentiment (r/wallstreetbets, r/stocks, r/investing)
3. StockTwits mentions and mood
4. Recent financial news sentiment

Provide a comprehensive sentiment analysis based on what you actually find."""
            )
            
            # Extract text from Responses API output
            result_text = self._extract_text(response)
            result = json.loads(result_text)
            
            # Add metadata
            result["timestamp"] = timestamp.isoformat()
            result["sources_searched"] = result.pop("sources_found", [])
            
            # Ensure values are in valid ranges
            result["social_sentiment_score"] = max(-1.0, min(1.0, result.get("social_sentiment_score", 0.0)))
            result["confidence"] = max(0.0, min(1.0, result.get("confidence", 0.0)))
            
            print(f"✅ Social sentiment: {result['social_sentiment_score']:.2f} (confidence: {result['confidence']:.2f})")
            print(f"   Sources: {', '.join(result['sources_searched'])}")
            print(f"   Themes: {', '.join(result.get('key_themes', [])[:3])}")
            
            return result
            
        except Exception as e:
            print(f"❌ Error in social sentiment web search: {e}")
            import traceback
            traceback.print_exc()
            
            # Return neutral fallback
            return {
                "social_sentiment_score": 0.0,
                "confidence": 0.1,
                "volume_trend": "stable",
                "key_themes": ["Web search unavailable"],
                "notes": f"Unable to perform web search for social sentiment. Error: {str(e)}",
                "sources_searched": [],
                "timestamp": timestamp.isoformat()
            }

    async def analyze_market(
        self,
        current_prices: Dict,
        technical_indicators: Dict,
        recent_news: List[Dict],
        macro_data: Dict
    ) -> Dict:
        """
        Analyze market conditions using OpenAI
        
        Args:
            current_prices: Current price data for indices/symbols
            technical_indicators: RSI, MACD, etc.
            recent_news: News articles with sentiment
            macro_data: VIX, treasury yields, etc.
        
        Returns:
            Structured analysis dict
        """
        context = self._build_context(current_prices, technical_indicators, recent_news, macro_data)
        
        try:
            # Use Chat Completions API for structured output
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": MARKET_ANALYST_SYSTEM_PROMPT},
                    {"role": "user", "content": context}
                ],
                response_format={"type": "json_object"},
                max_tokens=2000
            )
            
            # Extract text from response
            analysis_raw = self._extract_text(response)
            analysis = json.loads(analysis_raw)
            
            return analysis
        
        except Exception as e:
            print(f"Error calling OpenAI: {e}")
            import traceback
            traceback.print_exc()
            return self._fallback_analysis()

    def _extract_text(self, response) -> str:
        """
        Extract text content from OpenAI Responses API output
        """
        chunks: List[str] = []
        
        # Try to extract from response.output
        output = getattr(response, "output", None)
        if output is not None:
            for item in output:
                content = getattr(item, "content", None)
                if content is not None:
                    for content_item in content:
                        if getattr(content_item, "type", None) == "text":
                            chunks.append(content_item.text)
        
        # If no chunks found, try top-level output_text
        if not chunks:
            top_level = getattr(response, "output_text", None)
            if top_level:
                return top_level
        
        # If still no chunks, try to get from choices (Chat Completions API)
        if not chunks:
            choices = getattr(response, "choices", None)
            if choices and len(choices) > 0:
                message = getattr(choices[0], "message", None)
                if message:
                    return getattr(message, "content", "")
        
        return "".join(chunks).strip()

    def _build_context(
        self,
        current_prices: Dict,
        technical_indicators: Dict,
        recent_news: List[Dict],
        macro_data: Dict
    ) -> str:
        """Build context prompt for LLM"""
        context = f"""
# Market Analysis Request - {datetime.now().strftime("%Y-%m-%d %H:%M")}

## Current Prices
{json.dumps(current_prices, indent=2)}

## Technical Indicators
{json.dumps(technical_indicators, indent=2)}

## Recent News (Last 24 Hours)
{json.dumps(recent_news if isinstance(recent_news, dict) else recent_news[:10] if isinstance(recent_news, list) else {}, indent=2)}

## Macro Data
{json.dumps(macro_data, indent=2)}

---

Please analyze this data and provide your market outlook. Remember to PRIORITIZE NEWS AND SENTIMENT in your analysis.
"""
        return context

    async def explain_prediction(
        self,
        prediction: Dict,
        user_question: str
    ) -> str:
        """
        Generate natural language explanation for a prediction
        
        Args:
            prediction: The prediction dict
            user_question: User's question (e.g., "Why is this bullish?")
        
        Returns:
            Natural language explanation
        """
        try:
            prompt = f"""
Given this market prediction:
{json.dumps(prediction, indent=2)}

User question: {user_question}

Provide a clear, concise explanation in 2-3 paragraphs. Focus on:
1. The key factors driving this prediction
2. The news/sentiment impact
3. The level of confidence and why

Be conversational and helpful.
"""
            
            # Use Chat Completions API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful market analyst explaining predictions to traders."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500
            )
            
            explanation = self._extract_text(response)
            return explanation
        
        except Exception as e:
            print(f"Error generating explanation: {e}")
            import traceback
            traceback.print_exc()
            return "Sorry, I couldn't generate an explanation at this time. Please try again."

    def _fallback_analysis(self) -> Dict:
        """Return fallback analysis when ChatGPT-5.1 is unavailable"""
        return {
            "direction": "neutral",
            "confidence": 0.3,
            "expected_move_percent": 0.0,
            "time_horizon": "1h",
            "key_factors": [
                {
                    "factor": "ChatGPT-5.1 unavailable - using fallback analysis",
                    "impact": "high",
                    "sentiment": "neutral"
                }
            ],
            "risks": [
                {
                    "risk": "Limited analysis without LLM",
                    "probability": "high"
                }
            ],
            "news_impact": {
                "sentiment": 0.0,
                "importance": 0.0,
                "summary": "No news analysis available"
            },
            "reasoning": "ChatGPT-5.1 analysis is currently unavailable. Prediction is based on technical indicators only."
        }

# Singleton instance
market_analyst = MarketAnalyst()

