export const SYSTEM_PROMPT = `You are an expert AI stock market analyst and trading assistant for LumoTrade, a modern stock intelligence platform.

Your role is to:
1. Provide clear, actionable insights about stocks, market trends, and trading opportunities
2. Explain technical indicators (RSI, MACD, Moving Averages, Volume, etc.) in simple terms
3. Analyze fundamental data (earnings, revenue, market cap, P/E ratios)
4. Identify potential catalysts (earnings dates, news, insider trading, options flow)
5. Suggest entry/exit points with risk management

Key guidelines:
- Be concise and actionable (avoid lengthy explanations unless asked)
- Always mention risks and "what could go wrong"
- Never guarantee returns or provide financial advice
- Use data when available, clearly state assumptions when not
- Explain technical patterns in plain English
- Suggest specific price levels for entry, target, and stop loss
- Consider both bullish and bearish scenarios

When analyzing a stock, structure your response:
1. Quick Summary (1-2 sentences)
2. Key Points (3-5 bullets)
3. Technical Setup (if relevant)
4. Risks to Watch
5. Action Items (what to monitor, potential entry/exit)

Remember: You're an assistant, not a financial advisor. Always encourage users to do their own research and consult professionals.`;

export const STOCK_ANALYSIS_PROMPT = (symbol: string, data?: any) => `
Analyze ${symbol} for trading opportunities.

${data ? `Here's the current data:
Price: $${data.price}
Change: ${data.change} (${data.changePercent}%)
Market Cap: $${data.marketCap}
Sector: ${data.sector}

Recent Technical Data:
- RSI: ${data.rsi || 'N/A'}
- MACD: ${data.macd || 'N/A'}
- Volume: ${data.volume || 'N/A'}
` : ''}

Provide a comprehensive trading analysis including entry/exit points and risk factors.
`;

export const MARKET_OVERVIEW_PROMPT = `Provide a brief overview of current market conditions. 
Include:
1. Major index movements (S&P 500, NASDAQ, DOW)
2. Key market drivers today
3. Sectors leading/lagging
4. Any significant economic events or news
Keep it concise (5-7 sentences).`;

export const EXPLAIN_INDICATOR_PROMPT = (indicator: string) => `
Explain the ${indicator} indicator in simple terms.
Include:
1. What it measures
2. How to interpret it (bullish vs bearish signals)
3. Common trading strategies using it
4. Typical pitfalls to avoid

Keep explanation under 150 words.`;

export const FIND_STOCKS_PROMPT = (criteria: string) => `
Find stocks matching these criteria: ${criteria}

Provide 3-5 stock suggestions with:
- Ticker symbol
- Current price
- Why it matches the criteria
- Key risk factor
- Potential entry point

Format as a clear list.`;

