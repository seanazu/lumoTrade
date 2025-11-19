import { Pattern, PricePoint, PatternType, PATTERN_DESCRIPTIONS } from './patterns';

export class PatternAnalyzer {
  private data: PricePoint[];

  constructor(data: PricePoint[]) {
    this.data = data;
  }

  // Detect all patterns in the dataset
  detectPatterns(): Pattern[] {
    const patterns: Pattern[] = [];

    // Run pattern detection algorithms
    patterns.push(...this.detectDoubleTop());
    patterns.push(...this.detectDoubleBottom());
    patterns.push(...this.detectBreakout());
    patterns.push(...this.detectBreakdown());
    patterns.push(...this.detectTriangles());
    patterns.push(...this.detectFlags());

    // Sort by confidence and return top patterns
    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  // Double Top Pattern Detection
  private detectDoubleTop(): Pattern[] {
    const patterns: Pattern[] = [];
    const peaks = this.findPeaks();

    for (let i = 1; i < peaks.length; i++) {
      const peak1 = peaks[i - 1];
      const peak2 = peaks[i];

      // Check if peaks are at similar levels (within 2%)
      const priceDiff = Math.abs(peak1.high - peak2.high) / peak1.high;
      if (priceDiff < 0.02) {
        // Find the valley between peaks
        const valley = this.findValleyBetween(peak1.time, peak2.time);
        if (valley) {
          const confidence = this.calculateDoubleTopConfidence(peak1, valley, peak2);
          if (confidence > 60) {
            patterns.push({
              type: 'double_top',
              confidence,
              description: PATTERN_DESCRIPTIONS.double_top,
              bullish: false,
              startIndex: peak1.time,
              endIndex: peak2.time,
              keyLevels: {
                resistance: Math.max(peak1.high, peak2.high),
                support: valley.low,
                target: valley.low - (peak1.high - valley.low),
                stopLoss: Math.max(peak1.high, peak2.high) + (peak1.high - valley.low) * 0.1,
              },
            });
          }
        }
      }
    }

    return patterns;
  }

  // Double Bottom Pattern Detection
  private detectDoubleBottom(): Pattern[] {
    const patterns: Pattern[] = [];
    const valleys = this.findValleys();

    for (let i = 1; i < valleys.length; i++) {
      const valley1 = valleys[i - 1];
      const valley2 = valleys[i];

      // Check if valleys are at similar levels (within 2%)
      const priceDiff = Math.abs(valley1.low - valley2.low) / valley1.low;
      if (priceDiff < 0.02) {
        // Find the peak between valleys
        const peak = this.findPeakBetween(valley1.time, valley2.time);
        if (peak) {
          const confidence = this.calculateDoubleBottomConfidence(valley1, peak, valley2);
          if (confidence > 60) {
            patterns.push({
              type: 'double_bottom',
              confidence,
              description: PATTERN_DESCRIPTIONS.double_bottom,
              bullish: true,
              startIndex: valley1.time,
              endIndex: valley2.time,
              keyLevels: {
                support: Math.min(valley1.low, valley2.low),
                resistance: peak.high,
                target: peak.high + (peak.high - valley1.low),
                stopLoss: Math.min(valley1.low, valley2.low) - (peak.high - valley1.low) * 0.1,
              },
            });
          }
        }
      }
    }

    return patterns;
  }

  // Breakout Detection
  private detectBreakout(): Pattern[] {
    const patterns: Pattern[] = [];
    const recentData = this.data.slice(-20); // Last 20 periods

    if (recentData.length < 10) return patterns;

    // Calculate resistance level (highest high in recent data)
    const resistance = Math.max(...recentData.slice(0, -1).map((p) => p.high));
    const currentPrice = recentData[recentData.length - 1].close;
    const previousPrice = recentData[recentData.length - 2].close;

    // Check if price just broke above resistance
    if (currentPrice > resistance && previousPrice <= resistance) {
      const volume = recentData[recentData.length - 1].volume;
      const avgVolume = recentData.slice(0, -1).reduce((sum, p) => sum + p.volume, 0) / (recentData.length - 1);

      // Higher confidence with higher volume
      const volumeMultiplier = volume / avgVolume;
      const confidence = Math.min(95, 70 + volumeMultiplier * 10);

      patterns.push({
        type: 'breakout',
        confidence,
        description: PATTERN_DESCRIPTIONS.breakout,
        bullish: true,
        startIndex: this.data.length - 20,
        endIndex: this.data.length - 1,
        keyLevels: {
          resistance,
          target: currentPrice + (currentPrice - resistance) * 1.5,
          stopLoss: resistance - (currentPrice - resistance) * 0.5,
        },
      });
    }

    return patterns;
  }

  // Breakdown Detection
  private detectBreakdown(): Pattern[] {
    const patterns: Pattern[] = [];
    const recentData = this.data.slice(-20);

    if (recentData.length < 10) return patterns;

    const support = Math.min(...recentData.slice(0, -1).map((p) => p.low));
    const currentPrice = recentData[recentData.length - 1].close;
    const previousPrice = recentData[recentData.length - 2].close;

    if (currentPrice < support && previousPrice >= support) {
      const volume = recentData[recentData.length - 1].volume;
      const avgVolume = recentData.slice(0, -1).reduce((sum, p) => sum + p.volume, 0) / (recentData.length - 1);

      const volumeMultiplier = volume / avgVolume;
      const confidence = Math.min(95, 70 + volumeMultiplier * 10);

      patterns.push({
        type: 'breakdown',
        confidence,
        description: PATTERN_DESCRIPTIONS.breakdown,
        bullish: false,
        startIndex: this.data.length - 20,
        endIndex: this.data.length - 1,
        keyLevels: {
          support,
          target: currentPrice - (support - currentPrice) * 1.5,
          stopLoss: support + (support - currentPrice) * 0.5,
        },
      });
    }

    return patterns;
  }

  // Triangle Pattern Detection (simplified)
  private detectTriangles(): Pattern[] {
    // Placeholder for triangle detection
    return [];
  }

  // Flag Pattern Detection (simplified)
  private detectFlags(): Pattern[] {
    // Placeholder for flag detection
    return [];
  }

  // Helper: Find peaks in price data
  private findPeaks(): PricePoint[] {
    const peaks: PricePoint[] = [];
    for (let i = 1; i < this.data.length - 1; i++) {
      if (
        this.data[i].high > this.data[i - 1].high &&
        this.data[i].high > this.data[i + 1].high
      ) {
        peaks.push(this.data[i]);
      }
    }
    return peaks;
  }

  // Helper: Find valleys in price data
  private findValleys(): PricePoint[] {
    const valleys: PricePoint[] = [];
    for (let i = 1; i < this.data.length - 1; i++) {
      if (
        this.data[i].low < this.data[i - 1].low &&
        this.data[i].low < this.data[i + 1].low
      ) {
        valleys.push(this.data[i]);
      }
    }
    return valleys;
  }

  // Helper: Find valley between two time points
  private findValleyBetween(start: number, end: number): PricePoint | null {
    const between = this.data.filter((p) => p.time > start && p.time < end);
    if (between.length === 0) return null;
    return between.reduce((min, p) => (p.low < min.low ? p : min));
  }

  // Helper: Find peak between two time points
  private findPeakBetween(start: number, end: number): PricePoint | null {
    const between = this.data.filter((p) => p.time > start && p.time < end);
    if (between.length === 0) return null;
    return between.reduce((max, p) => (p.high > max.high ? p : max));
  }

  // Confidence calculation for double top
  private calculateDoubleTopConfidence(
    peak1: PricePoint,
    valley: PricePoint,
    peak2: PricePoint
  ): number {
    const priceSimilarity = 1 - Math.abs(peak1.high - peak2.high) / peak1.high;
    const depthRatio = (peak1.high - valley.low) / peak1.high;
    return Math.min(95, 60 + priceSimilarity * 20 + depthRatio * 15);
  }

  // Confidence calculation for double bottom
  private calculateDoubleBottomConfidence(
    valley1: PricePoint,
    peak: PricePoint,
    valley2: PricePoint
  ): number {
    const priceSimilarity = 1 - Math.abs(valley1.low - valley2.low) / valley1.low;
    const heightRatio = (peak.high - valley1.low) / valley1.low;
    return Math.min(95, 60 + priceSimilarity * 20 + heightRatio * 15);
  }
}

// Export factory function
export function analyzePatterns(data: PricePoint[]): Pattern[] {
  const analyzer = new PatternAnalyzer(data);
  return analyzer.detectPatterns();
}

