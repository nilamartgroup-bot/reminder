/**
 * Super-App Audio, Custom Ringtone & Screen WakeLock Service
 * Handles user custom audio from phone/device, audio synthesis, and screen wake lock on alarm.
 */

const AUDIO_STORAGE_KEY = 'reminder_custom_audio_meta';
const CUSTOM_AUDIO_BLOB_KEY = 'reminder_custom_audio_blob';
const IDB_NAME = 'reminder_super_audio_idb';
const IDB_STORE = 'audio_files';

export interface SoundPreset {
  id: string;
  name: string;
  isCustom?: boolean;
}

export const SOUND_PRESETS: SoundPreset[] = [
  { id: 'custom', name: '🎵 موزیک انتخابی از گوشی', isCustom: true },
  { id: 'chime', name: '🔔 زنگ کریستالی ملایم' },
  { id: 'alarm', name: '⏰ آلارم ساعت دیجیتال' },
  { id: 'gentle', name: '🎶 زنگوله هارمونیک آرام' },
  { id: 'pulse', name: '⚡ زنگ هشدار پرانرژی' },
];

let activeAudioElement: HTMLAudioElement | null = null;
let activeWakeLock: any = null;
let cachedBlobUrl: string | null = null;

// IndexedDB helper for storing full-size audio blobs
function openAudioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = window.indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export class CustomAudioService {
  private static instance: CustomAudioService;

  public static getInstance(): CustomAudioService {
    if (!CustomAudioService.instance) {
      CustomAudioService.instance = new CustomAudioService();
    }
    return CustomAudioService.instance;
  }

  // Save custom audio file (from user mobile/desktop) to IndexedDB with localStorage fallback
  public async saveCustomAudio(file: File): Promise<{ success: boolean; name: string }> {
    const meta = {
      name: file.name,
      size: file.size,
      type: file.type,
      updatedAt: new Date().toISOString(),
    };

    // Release old cached object URL if exists
    if (cachedBlobUrl) {
      URL.revokeObjectURL(cachedBlobUrl);
      cachedBlobUrl = null;
    }

    // Try IndexedDB first (supports any size music files)
    try {
      const db = await openAudioDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        store.put(file, 'user_alarm_sound');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(meta));
      cachedBlobUrl = URL.createObjectURL(file);
      return { success: true, name: file.name };
    } catch (idbErr) {
      console.warn('IDB failed, falling back to base64 localStorage:', idbErr);
    }

    // Fallback to base64 in localStorage
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const base64Data = reader.result as string;
          localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(meta));
          localStorage.setItem(CUSTOM_AUDIO_BLOB_KEY, base64Data);
          resolve({ success: true, name: file.name });
        } catch (err) {
          console.error('Failed to store audio in localStorage:', err);
          resolve({ success: false, name: file.name });
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  public getCustomAudioMeta(): { name: string; size: number } | null {
    try {
      const meta = localStorage.getItem(AUDIO_STORAGE_KEY);
      return meta ? JSON.parse(meta) : null;
    } catch {
      return null;
    }
  }

  public async deleteCustomAudio(): Promise<void> {
    try {
      localStorage.removeItem(AUDIO_STORAGE_KEY);
      localStorage.removeItem(CUSTOM_AUDIO_BLOB_KEY);
      if (cachedBlobUrl) {
        URL.revokeObjectURL(cachedBlobUrl);
        cachedBlobUrl = null;
      }
      try {
        const db = await openAudioDB();
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).delete('user_alarm_sound');
      } catch {
        // ignore
      }
      this.stop();
    } catch {
      // ignore
    }
  }

  public async getCustomAudioUrl(): Promise<string | null> {
    if (cachedBlobUrl) return cachedBlobUrl;

    // Try IndexedDB first
    try {
      const db = await openAudioDB();
      const blob = await new Promise<Blob | null>((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).get('user_alarm_sound');
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
      if (blob) {
        cachedBlobUrl = URL.createObjectURL(blob);
        return cachedBlobUrl;
      }
    } catch {
      // fallback
    }

    try {
      return localStorage.getItem(CUSTOM_AUDIO_BLOB_KEY);
    } catch {
      return null;
    }
  }

  // Play audio (custom audio from device or synthesized chime)
  public async playSound(soundId: string = 'custom', volume: number = 1.0, loop: boolean = false): Promise<void> {
    this.stop();

    const selectedSound = soundId || localStorage.getItem('reminder_pref_sound_type') || 'custom';
    const customUrl = await this.getCustomAudioUrl();

    if (selectedSound === 'custom' && customUrl) {
      try {
        const audio = new Audio(customUrl);
        audio.volume = Math.max(0.1, Math.min(1.0, volume));
        audio.loop = loop;
        activeAudioElement = audio;
        await audio.play();
        return;
      } catch (err) {
        console.warn('Custom audio playback failed, falling back to chime:', err);
      }
    }

    // Synthesized offline Web Audio API presets
    this.playSynthesizedPreset(selectedSound, volume);
  }

  public stop(): void {
    if (activeAudioElement) {
      try {
        activeAudioElement.pause();
        activeAudioElement.currentTime = 0;
      } catch {
        // ignore
      }
      activeAudioElement = null;
    }
  }

  private playSynthesizedPreset(presetId: string, volume: number): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const safeVol = Math.max(0.05, Math.min(1.0, volume));

      if (presetId === 'alarm' || presetId === 'pulse') {
        // Digital alarm burst
        [0, 0.15, 0.3, 0.6, 0.75, 0.9].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = presetId === 'pulse' ? 'sawtooth' : 'square';
          osc.frequency.setValueAtTime(presetId === 'pulse' ? 987.77 : 880, now + offset);
          gain.gain.setValueAtTime(0, now + offset);
          gain.gain.linearRampToValueAtTime(0.25 * safeVol, now + offset + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.13);
        });
      } else if (presetId === 'gentle') {
        // Gentle acoustic chime
        [587.33, 739.99, 880, 1174.66].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.15);
          gain.gain.setValueAtTime(0.2 * safeVol, now + idx * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.8);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.15);
          osc.stop(now + idx * 0.15 + 0.85);
        });
      } else {
        // Crystal marimba chime
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);
          gain.gain.setValueAtTime(0.3 * safeVol, now + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.65);
        });
      }
    } catch (e) {
      console.error('Synthesized sound error:', e);
    }
  }

  // Request Mobile Screen Wake Lock
  public async requestScreenWakeLock(): Promise<boolean> {
    try {
      if ('wakeLock' in navigator && (navigator as any).wakeLock) {
        activeWakeLock = await (navigator as any).wakeLock.request('screen');
        activeWakeLock.addEventListener('release', () => {
          activeWakeLock = null;
        });
        return true;
      }
    } catch (err) {
      console.warn('Wake Lock request error:', err);
    }
    return false;
  }

  public releaseScreenWakeLock(): void {
    if (activeWakeLock) {
      try {
        activeWakeLock.release();
      } catch {
        // ignore
      }
      activeWakeLock = null;
    }
  }

  // Trigger rich system lock-screen notification with Action Buttons
  public async showLockScreenAlert(title: string, body: string, reminderId: string): Promise<void> {
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;

      const options: NotificationOptions & { actions?: Array<{ action: string; title: string }>; vibrate?: number[] } = {
        body: body || 'زمان سررسید این یادآوری فرا رسیده است.',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: `reminder-${reminderId}`,
        requireInteraction: true,
        vibrate: [300, 150, 300, 150, 300],
        data: { reminderId },
        actions: [
          { action: 'complete', title: '✓ انجام شد' },
          { action: 'snooze', title: '⏱ تعویق ۱۰ دقیقه' },
        ],
      };

      // Service Worker registration notification if available
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.showNotification(title, options);
          return;
        }
      }

      // Standard browser notification fallback
      const notif = new Notification(title, options);
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (err) {
      console.warn('Lockscreen notification error:', err);
    }
  }
}

export const customAudioService = CustomAudioService.getInstance();
