/**
 * Core Platform Abstractions
 * Isolates Android, iOS, and Web platform-specific APIs behind clean interfaces.
 */

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  scheduledTime: number; // Unix timestamp ms
  sound?: boolean;
  vibrate?: boolean;
  channelId?: string;
  category?: string;
  data?: Record<string, any>;
}

export interface ILocalNotificationService {
  requestPermission(): Promise<boolean>;
  hasPermission(): Promise<boolean>;
  schedule(notification: ScheduledNotification): Promise<void>;
  cancel(id: string): Promise<void>;
  cancelAll(): Promise<void>;
  playAlarmSound(): void;
  vibrate(pattern?: number[]): void;
}

export interface IStorageService {
  getString(key: string): Promise<string | null>;
  setString(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface INetworkService {
  isOnline(): boolean;
  addListener(callback: (online: boolean) => void): () => void;
}

export interface IDeviceService {
  getPlatform(): 'android' | 'ios' | 'web';
  getTimezone(): string;
  isStandalonePWA(): boolean;
}

// Web & Cross-platform implementation of LocalNotificationService
export class CrossPlatformLocalNotificationService implements ILocalNotificationService {
  private activeTimers: Map<string, number> = new Map();

  public async requestPermission(): Promise<boolean> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const res = await Notification.requestPermission();
      return res === 'granted';
    }
    return false;
  }

  public async hasPermission(): Promise<boolean> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  }

  public async schedule(notification: ScheduledNotification): Promise<void> {
    const now = Date.now();
    const delay = notification.scheduledTime - now;

    if (delay > 0) {
      if (this.activeTimers.has(notification.id)) {
        window.clearTimeout(this.activeTimers.get(notification.id));
      }

      // In browser/PWA context:
      const timer = window.setTimeout(() => {
        this.triggerNotification(notification);
        this.activeTimers.delete(notification.id);
      }, delay);

      this.activeTimers.set(notification.id, timer);
    }
  }

  public async cancel(id: string): Promise<void> {
    if (this.activeTimers.has(id)) {
      window.clearTimeout(this.activeTimers.get(id));
      this.activeTimers.delete(id);
    }
  }

  public async cancelAll(): Promise<void> {
    this.activeTimers.forEach((timer) => window.clearTimeout(timer));
    this.activeTimers.clear();
  }

  public triggerNotification(notification: ScheduledNotification): void {
    if (notification.sound) {
      this.playAlarmSound();
    }
    if (notification.vibrate) {
      this.vibrate();
    }

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notification.title, {
          body: notification.body,
          icon: '/icon.svg',
          badge: '/favicon.ico',
          data: notification.data,
        });
      } catch (err) {
        console.warn('System notification presentation error:', err);
      }
    }
  }

  public playAlarmSound(): void {
    if (typeof window === 'undefined') return;
    try {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      // Crystal chime chime-alert chord
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.6);
      });
    } catch (err) {
      console.warn('Audio synthesis warning:', err);
    }
  }

  public vibrate(pattern: number[] = [150, 100, 200]): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // ignore
      }
    }
  }
}

// Device Service
export class DeviceService implements IDeviceService {
  public getPlatform(): 'android' | 'ios' | 'web' {
    if (typeof window === 'undefined') return 'web';
    const ua = navigator.userAgent.toLowerCase();
    if (/android/.test(ua)) return 'android';
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    return 'web';
  }

  public getTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Tehran';
  }

  public isStandalonePWA(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
  }
}

// Network Service
export class NetworkService implements INetworkService {
  public isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  public addListener(callback: (online: boolean) => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const onOnline = () => callback(true);
    const onOffline = () => callback(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }
}

// Default exported instances
export const localNotificationService = new CrossPlatformLocalNotificationService();
export const deviceService = new DeviceService();
export const networkService = new NetworkService();
