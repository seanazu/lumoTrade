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
    def __init__(self, model: str = "chatgpt-5.1"):
        self.model = model
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        if not os.getenv("OPENAI_API_KEY"):
            print("⚠ Warning: OPENAI_API_KEY not set. LLM analysis will not work.")

    async def analyze_market(
        self,
        current_prices: Dict,
        technical_indicators: Dict,
        recent_news: List[Dict],
        macro_data: Dict
    ) -> Dict:
        """
        Analyze market conditions using ChatGPT-5.1
        
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
            response = self.client.responses.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": MARKET_ANALYST_SYSTEM_PROMPT},
                    {"role": "user", "content": context}
                ],
                response_format={"type": "json_object"},
                max_output_tokens=2000
            )
            
            # Extract text from response
            analysis_raw = self._extract_text(response)
            analysis = json.loads(analysis_raw)
            
            return analysis
        
        except Exception as e:
            print(f"Error calling ChatGPT-5.1: {e}")
            return self._fallback_analysis()

    def _extract_text(self, response) -> str:
        """
        Extract text content from OpenAI Responses API output
        """
        chunks: List[str] = []
        
        # Try to extract from response.output
        for item in getattr(response, "output", []):
            for content in getattr(item, "content", []):
                if getattr(content, "type", None) == "text":
                    chunks.append(content.text)
        
        # If no chunks found, try top-level output_text
        if not chunks:
            top_level = getattr(response, "output_text", None)
            if top_level:
                return top_level
        
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
{json.dumps(recent_news[:10], indent=2)}

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
            
            response = self.client.responses.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful market analyst explaining predictions to traders."},
                    {"role": "user", "content": prompt}
                ],
                max_output_tokens=500
            )
            
            explanation = self._extract_text(response)
            return explanation
        
        except Exception as e:
            print(f"Error generating explanation: {e}")
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

