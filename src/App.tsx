import React, { useState, useEffect } from 'react';
import { WidgetConfig, AppSettings } from './types/widget';
import {
  getSavedWidgets,
  saveWidget,
  deleteWidget,
  duplicateWidget,
  rotateWidgetPhoto,
  getAppSettings,
  saveAppSettings,
  syncToNativeAndroid,
} from './utils/storage';
import { HomeScreen } from './components/HomeScreen';
import { WidgetEditor } from './components/WidgetEditor';
import { LauncherSimulator } from './components/LauncherSimulator';
import { SettingsModal } from './components/SettingsModal';
import { HelloSplashScreen } from './components/HelloSplashScreen';

export default function App() {
  const [isStartingUp, setIsStartingUp] = useState(true);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => getSavedWidgets());
  const [settings, setSettings] = useState<AppSettings>(() => getAppSettings());
  const [activeView, setActiveView] = useState<'home' | 'editor' | 'simulator'>('home');
  const [editingWidget, setEditingWidget] = useState<WidgetConfig | null>(null);
  const [simulatorWidgetId, setSimulatorWidgetId] = useState<string>(widgets[0]?.id || '');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Sync saved widgets with Android native widgets on launch
  useEffect(() => {
    syncToNativeAndroid(widgets);
  }, []);

  // Background interval simulation for live photo cycling
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      widgets.forEach((w) => {
        if (w.photos.length <= 1) return;
        let intervalMs = 0;
        switch (w.schedule.interval) {
          case '15m':
            intervalMs = 15 * 60 * 1000;
            break;
          case '30m':
            intervalMs = 30 * 60 * 1000;
            break;
          case '1h':
            intervalMs = 60 * 60 * 1000;
            break;
          case '3h':
            intervalMs = 3 * 60 * 60 * 1000;
            break;
          case '6h':
            intervalMs = 6 * 60 * 60 * 1000;
            break;
          case '12h':
            intervalMs = 12 * 60 * 60 * 1000;
            break;
          case '24h':
            intervalMs = 24 * 60 * 60 * 1000;
            break;
          default:
            intervalMs = 0;
        }

        if (intervalMs > 0 && w.schedule.lastRotatedAt && now - w.schedule.lastRotatedAt > intervalMs) {
          setWidgets(rotateWidgetPhoto(w.id));
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [widgets]);

  // Handlers
  const handleOpenCreate = () => {
    setEditingWidget(null);
    setActiveView('editor');
  };

  const handleEditWidget = (w: WidgetConfig) => {
    setEditingWidget(w);
    setActiveView('editor');
  };

  const handleSaveWidget = (saved: WidgetConfig) => {
    const updated = saveWidget(saved);
    setWidgets(updated);
    setActiveView('home');
    setEditingWidget(null);
  };

  const handleDeleteWidget = (id: string) => {
    const updated = deleteWidget(id);
    setWidgets(updated);
  };

  const handleDuplicateWidget = (id: string) => {
    const updated = duplicateWidget(id);
    setWidgets(updated);
  };

  const handleRotatePhoto = (id: string) => {
    const updated = rotateWidgetPhoto(id);
    setWidgets(updated);
  };

  const handleOpenSimulator = (w?: WidgetConfig) => {
    const target = w || widgets[0];
    if (target) {
      setSimulatorWidgetId(target.id);
    }
    setActiveView('simulator');
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveAppSettings(newSettings);
  };

  const currentSimulatorWidget = widgets.find((w) => w.id === simulatorWidgetId) || widgets[0];

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {isStartingUp && (
        <HelloSplashScreen onComplete={() => setIsStartingUp(false)} />
      )}

      {activeView === 'home' && (
        <HomeScreen
          widgets={widgets}
          onOpenCreate={handleOpenCreate}
          onEditWidget={handleEditWidget}
          onDeleteWidget={handleDeleteWidget}
          onDuplicateWidget={handleDuplicateWidget}
          onRotatePhoto={handleRotatePhoto}
          onOpenSimulator={handleOpenSimulator}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {activeView === 'editor' && (
        <WidgetEditor
          widget={editingWidget}
          onSave={handleSaveWidget}
          onCancel={() => {
            setActiveView('home');
            setEditingWidget(null);
          }}
        />
      )}

      {activeView === 'simulator' && currentSimulatorWidget && (
        <LauncherSimulator
          widget={currentSimulatorWidget}
          allWidgets={widgets}
          onSelectWidget={(w) => setSimulatorWidgetId(w.id)}
          onCyclePhoto={handleRotatePhoto}
          onBack={() => setActiveView('home')}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        widgets={widgets}
        onWidgetsUpdated={(newWidgets) => setWidgets(newWidgets)}
        settings={settings}
        onSettingsUpdated={handleUpdateSettings}
      />
    </div>
  );
}
