export type NotificationType =
  | 'price_breakout'
  | 'volume_spike'
  | 'pattern_detected'
  | 'news_alert'
  | 'earnings_reminder';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
}

class NotificationService {
  private permission: NotificationPermission = 'default';

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permission = 'granted';
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    }

    return false;
  }

  async show(options: NotificationOptions): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return;
    }

    if (Notification.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) {
        console.warn('Notification permission denied');
        return;
      }
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: options.tag || `notification-${Date.now()}`,
        data: options.data,
        requireInteraction: false,
        silent: false,
      });

      notification.onclick = () => {
        window.focus();
        if (options.data?.url) {
          window.location.href = options.data.url;
        }
        notification.close();
      };
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  isSupported(): boolean {
    return 'Notification' in window;
  }

  getPermission(): NotificationPermission {
    return Notification.permission;
  }

  // Predefined notification templates
  async showPriceAlert(symbol: string, price: number, condition: string) {
    await this.show({
      title: `${symbol} Price Alert! 🚨`,
      body: `${symbol} ${condition} at $${price.toFixed(2)}`,
      tag: `price-alert-${symbol}`,
      data: { url: `/analyzer?symbol=${symbol}`, type: 'price_breakout' },
    });
  }

  async showVolumeAlert(symbol: string, volumeIncrease: number) {
    await this.show({
      title: `${symbol} Volume Spike! 📊`,
      body: `Volume increased by ${volumeIncrease}% - unusual activity detected`,
      tag: `volume-alert-${symbol}`,
      data: { url: `/analyzer?symbol=${symbol}`, type: 'volume_spike' },
    });
  }

  async showPatternAlert(symbol: string, pattern: string, confidence: number) {
    await this.show({
      title: `${symbol} Pattern Detected! 📈`,
      body: `${pattern} pattern found (${confidence}% confidence)`,
      tag: `pattern-alert-${symbol}`,
      data: { url: `/analyzer?symbol=${symbol}`, type: 'pattern_detected' },
    });
  }

  async showNewsAlert(symbol: string, headline: string) {
    await this.show({
      title: `${symbol} News Alert! 📰`,
      body: headline,
      tag: `news-alert-${symbol}`,
      data: { url: `/analyzer?symbol=${symbol}`, type: 'news_alert' },
    });
  }

  async showEarningsReminder(symbol: string, date: string) {
    await this.show({
      title: `${symbol} Earnings Tomorrow! 📅`,
      body: `Earnings report on ${date}`,
      tag: `earnings-${symbol}`,
      data: { url: `/analyzer?symbol=${symbol}`, type: 'earnings_reminder' },
    });
  }
}

export const notificationService = new NotificationService();

