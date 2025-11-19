import { notificationService } from './notification-service';

interface PriceAlert {
  symbol: string;
  condition: 'above' | 'below';
  targetPrice: number;
  enabled: boolean;
}

interface VolumeAlert {
  symbol: string;
  threshold: number; // percentage increase
  enabled: boolean;
}

class AlertTriggerManager {
  private priceAlerts: Map<string, PriceAlert[]> = new Map();
  private volumeAlerts: Map<string, VolumeAlert> = new Map();
  private lastPrices: Map<string, number> = new Map();
  private lastVolumes: Map<string, number> = new Map();

  // Price alert management
  addPriceAlert(alert: PriceAlert) {
    const alerts = this.priceAlerts.get(alert.symbol) || [];
    alerts.push(alert);
    this.priceAlerts.set(alert.symbol, alerts);
  }

  removePriceAlert(symbol: string, targetPrice: number) {
    const alerts = this.priceAlerts.get(symbol) || [];
    const filtered = alerts.filter((a) => a.targetPrice !== targetPrice);
    if (filtered.length > 0) {
      this.priceAlerts.set(symbol, filtered);
    } else {
      this.priceAlerts.delete(symbol);
    }
  }

  // Check if price alert should trigger
  checkPriceAlert(symbol: string, currentPrice: number) {
    const alerts = this.priceAlerts.get(symbol);
    if (!alerts) return;

    const lastPrice = this.lastPrices.get(symbol);
    this.lastPrices.set(symbol, currentPrice);

    alerts.forEach((alert) => {
      if (!alert.enabled) return;

      const shouldTrigger =
        (alert.condition === 'above' && currentPrice >= alert.targetPrice && (lastPrice === undefined || lastPrice < alert.targetPrice)) ||
        (alert.condition === 'below' && currentPrice <= alert.targetPrice && (lastPrice === undefined || lastPrice > alert.targetPrice));

      if (shouldTrigger) {
        const condition = alert.condition === 'above' ? 'broke above' : 'dropped below';
        notificationService.showPriceAlert(symbol, currentPrice, condition);
      }
    });
  }

  // Volume alert management
  addVolumeAlert(alert: VolumeAlert) {
    this.volumeAlerts.set(alert.symbol, alert);
  }

  removeVolumeAlert(symbol: string) {
    this.volumeAlerts.delete(symbol);
  }

  // Check if volume alert should trigger
  checkVolumeAlert(symbol: string, currentVolume: number) {
    const alert = this.volumeAlerts.get(symbol);
    if (!alert || !alert.enabled) return;

    const lastVolume = this.lastVolumes.get(symbol);
    if (lastVolume) {
      const increase = ((currentVolume - lastVolume) / lastVolume) * 100;
      if (increase >= alert.threshold) {
        notificationService.showVolumeAlert(symbol, Math.round(increase));
      }
    }

    this.lastVolumes.set(symbol, currentVolume);
  }

  // Get all alerts for a symbol
  getAlertsForSymbol(symbol: string) {
    return {
      priceAlerts: this.priceAlerts.get(symbol) || [],
      volumeAlert: this.volumeAlerts.get(symbol),
    };
  }
}

export const alertTrigger = new AlertTriggerManager();

