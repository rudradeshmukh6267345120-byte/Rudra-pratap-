import { WidgetConfig, WidgetPhoto, AppSettings } from '../types/widget';

const STORAGE_KEY = 'glass_widgets_configs_v1';
const DB_NAME = 'glass_widgets_idb';
const DB_VERSION = 1;
const STORE_NAME = 'widget_photos';

// In-memory fallback cache if IndexedDB is restricted
const memoryPhotoCache = new Map<string, string>();

// Open IndexedDB connection safely
function openDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined' || !('indexedDB' in window) || !window.indexedDB) {
        return resolve(null);
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

// Store photo blob/dataUrl in IndexedDB with memory cache fallback
export async function storePhotoData(id: string, dataUrl: string): Promise<void> {
  memoryPhotoCache.set(id, dataUrl);
  try {
    const db = await openDB();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ id, dataUrl });
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('IndexedDB write fallback to in-memory', err);
  }
}

// Retrieve photo from IndexedDB with memory cache fallback
export async function getPhotoData(id: string): Promise<string | null> {
  if (memoryPhotoCache.has(id)) {
    return memoryPhotoCache.get(id) || null;
  }
  try {
    const db = await openDB();
    if (!db) return null;
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(id);
    return new Promise((resolve) => {
      request.onsuccess = () => {
        const result = request.result ? request.result.dataUrl : null;
        if (result) memoryPhotoCache.set(id, result);
        resolve(result);
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// Clean presets - No fake, stock, or placeholder photos
export const SAMPLE_PRESET_PHOTOS: WidgetPhoto[] = [];

// Real user collections matching user reference screenshots
export const DEFAULT_WIDGETS: WidgetConfig[] = [
  {
    id: 'widget-love',
    name: 'Love',
    photos: [
      {
        id: 'photo-90146',
        url: '/photos/90146.jpg',
        name: '90146.jpg',
        addedAt: 1729700000000,
      },
      {
        id: 'photo-89478',
        url: '/photos/89478.jpg',
        name: '89478.jpg',
        addedAt: 1729700010000,
      },
    ],
    activePhotoIndex: 0,
    frameShape: 'circle',
    border: {
      enabled: true,
      color: '#ffffff',
      width: 3,
      glow: true,
    },
    filter: {
      tone: 'original',
      intensity: 100,
    },
    texture: {
      type: 'none',
      intensity: 40,
    },
    schedule: {
      interval: '24h',
      order: 'sequential',
      moodRotation: false,
      lastRotatedAt: Date.now(),
    },
    aspectRatio: '1:1',
    createdAt: 1729700000000,
    updatedAt: 1729700000000,
  },
  {
    id: 'widget-sachi',
    name: 'sachi',
    photos: [
      {
        id: 'photo-89478-sachi',
        url: '/photos/89478.jpg',
        name: '89478.jpg',
        addedAt: 1729700010000,
      },
    ],
    activePhotoIndex: 0,
    frameShape: 'rounded_square',
    border: {
      enabled: true,
      color: '#ffffff',
      width: 2,
      glow: false,
    },
    filter: {
      tone: 'original',
      intensity: 100,
    },
    texture: {
      type: 'none',
      intensity: 40,
    },
    schedule: {
      interval: '24h',
      order: 'sequential',
      moodRotation: false,
      lastRotatedAt: Date.now(),
    },
    aspectRatio: '1:1',
    createdAt: 1729700000000,
    updatedAt: 1729700000000,
  },
];

export function getSavedWidgets(): WidgetConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_WIDGETS));
      return DEFAULT_WIDGETS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_WIDGETS));
      return DEFAULT_WIDGETS;
    }

    return parsed;
  } catch (err) {
    console.error('Failed to load widgets from localStorage', err);
    return DEFAULT_WIDGETS;
  }
}

export function syncToNativeAndroid(widgets: WidgetConfig[]): void {
  try {
    if (typeof window !== 'undefined' && (window as any).AndroidBridge?.syncWidgets) {
      (window as any).AndroidBridge.syncWidgets(JSON.stringify(widgets));
    }
  } catch (err) {
    console.warn('Native Android sync not available or failed', err);
  }
}

export function saveWidgets(widgets: WidgetConfig[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
    syncToNativeAndroid(widgets);
  } catch (err) {
    console.error('Failed to save widgets', err);
  }
}

export function saveWidget(widget: WidgetConfig): WidgetConfig[] {
  const current = getSavedWidgets();
  const index = current.findIndex((w) => w.id === widget.id);
  const now = Date.now();
  const updatedWidget = { ...widget, updatedAt: now };

  let updatedList: WidgetConfig[];
  if (index >= 0) {
    updatedList = [...current];
    updatedList[index] = updatedWidget;
  } else {
    updatedList = [updatedWidget, ...current];
  }

  saveWidgets(updatedList);
  return updatedList;
}

export function deleteWidget(id: string): WidgetConfig[] {
  const current = getSavedWidgets();
  const filtered = current.filter((w) => w.id !== id);
  saveWidgets(filtered);
  return filtered;
}

export function duplicateWidget(id: string): WidgetConfig[] {
  const current = getSavedWidgets();
  const target = current.find((w) => w.id === id);
  if (!target) return current;

  const duplicated: WidgetConfig = {
    ...target,
    id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: `${target.name} (Copy)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const updated = [duplicated, ...current];
  saveWidgets(updated);
  return updated;
}

export function rotateWidgetPhoto(id: string): WidgetConfig[] {
  const current = getSavedWidgets();
  const target = current.find((w) => w.id === id);
  if (!target || target.photos.length <= 1) return current;

  let nextIndex = target.activePhotoIndex;
  if (target.schedule.order === 'random') {
    let rand = Math.floor(Math.random() * target.photos.length);
    while (rand === target.activePhotoIndex && target.photos.length > 1) {
      rand = Math.floor(Math.random() * target.photos.length);
    }
    nextIndex = rand;
  } else {
    nextIndex = (target.activePhotoIndex + 1) % target.photos.length;
  }

  const updatedWidget: WidgetConfig = {
    ...target,
    activePhotoIndex: nextIndex,
    schedule: {
      ...target.schedule,
      lastRotatedAt: Date.now(),
    },
    updatedAt: Date.now(),
  };

  const updatedList = current.map((w) => (w.id === id ? updatedWidget : w));
  saveWidgets(updatedList);
  return updatedList;
}

const SETTINGS_KEY = 'glass_widgets_app_settings_v1';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  defaultWidgetSize: 'medium',
  photoFitting: 'cover',
  defaultInterval: '24h',
  autoMoodRotation: false,
  hapticFeedback: true,
};

export function getAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_APP_SETTINGS;
    return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

export function saveAppSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings', err);
  }
}

export function exportWidgetsJson(): string {
  const widgets = getSavedWidgets();
  return JSON.stringify(widgets, null, 2);
}

export function importWidgetsJson(jsonStr: string): WidgetConfig[] {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) throw new Error('Invalid backup format');
    saveWidgets(parsed);
    return parsed;
  } catch (err) {
    console.error('Failed to import widgets', err);
    throw err;
  }
}
