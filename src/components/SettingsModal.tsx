import React, { useState } from 'react';
import { WidgetConfig, AppSettings, RotationInterval } from '../types/widget';
import { exportWidgetsJson, importWidgetsJson, saveWidgets, DEFAULT_WIDGETS } from '../utils/storage';
import { AppLogo } from './AppLogo';
import {
  ArrowLeft,
  X,
  ShieldCheck,
  Download,
  Upload,
  RotateCcw,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: WidgetConfig[];
  onWidgetsUpdated: (widgets: WidgetConfig[]) => void;
  settings: AppSettings;
  onSettingsUpdated: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  widgets,
  onWidgetsUpdated,
  settings,
  onSettingsUpdated,
}) => {
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const totalPhotos = widgets.reduce((acc, w) => acc + w.photos.length, 0);

  const handleExport = () => {
    const json = exportWidgetsJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `glass-widgets-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(false);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const imported = importWidgetsJson(text);
        onWidgetsUpdated(imported);
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 3000);
      } catch {
        setImportError('Invalid backup file. Please select a valid JSON export.');
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteReset = () => {
    if (isResetting) return;
    setIsResetting(true);
    saveWidgets(DEFAULT_WIDGETS);
    onWidgetsUpdated(DEFAULT_WIDGETS);
    setShowResetConfirm(false);
    setResetSuccess(true);
    setTimeout(() => {
      setResetSuccess(false);
      setIsResetting(false);
    }, 3000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg bg-[#000000] border border-white/20 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,1)] overflow-hidden text-slate-100 flex flex-col max-h-[90vh] gpu-60fps"
          >
            {/* Top Header - Pure OLED Black & Frosted Glass */}
            <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-[#000000] backdrop-blur-md shrink-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-press min-h-[44px] min-w-[44px] flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.16] border border-white/20 text-white font-medium text-xs transition-colors group shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
                  title="Back"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Back</span>
                </button>
                <div className="h-4 w-px bg-white/20" />
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">Settings &amp; Preferences</h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="icon-btn-press min-h-[44px] min-w-[44px] rounded-xl bg-white/[0.08] hover:bg-white/[0.16] border border-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

        {/* Scrollable Settings Content - Full Flex height with proper padding */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 pb-12 space-y-6 text-left">
          {/* SECTION 1: WIDGET PREFERENCES */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-white uppercase tracking-wider block">
              Widget Preferences
            </span>

            {/* Default Widget Size */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/15 space-y-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Default Widget Size</span>
                <span className="text-[11px] font-mono text-white/80 capitalize">{settings.defaultWidgetSize}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {(['small', 'medium', 'large'] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => onSettingsUpdated({ ...settings, defaultWidgetSize: sz })}
                    className={`chip-press py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                      settings.defaultWidgetSize === sz
                        ? 'bg-white text-black border-white shadow-md font-bold'
                        : 'bg-white/[0.05] text-slate-300 border-white/10 hover:bg-white/[0.12] hover:text-white'
                    }`}
                  >
                    {sz === 'small' ? '2×2 Small' : sz === 'medium' ? '4×2 Medium' : '4×4 Large'}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo Fitting */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/15 flex items-center justify-between gap-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <div>
                <span className="text-xs font-semibold text-white block">Photo Fit Mode</span>
                <span className="text-[11px] text-slate-400">Crop to fill widget shape or fit within borders</span>
              </div>
              <div className="flex items-center gap-1 bg-white/[0.06] p-1 rounded-xl border border-white/15 shrink-0">
                <button
                  onClick={() => onSettingsUpdated({ ...settings, photoFitting: 'cover' })}
                  className={`chip-press px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                    settings.photoFitting === 'cover' ? 'bg-white text-black font-bold shadow-sm' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Fill
                </button>
                <button
                  onClick={() => onSettingsUpdated({ ...settings, photoFitting: 'contain' })}
                  className={`chip-press px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                    settings.photoFitting === 'contain' ? 'bg-white text-black font-bold shadow-sm' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Fit
                </button>
              </div>
            </div>

            {/* Default Schedule Interval */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/15 space-y-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Default Rotation Interval</span>
                <span className="text-[11px] font-mono text-white/80">{settings.defaultInterval}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 pt-1">
                {(['1h', '6h', '12h', '24h'] as const).map((int) => (
                  <button
                    key={int}
                    onClick={() => onSettingsUpdated({ ...settings, defaultInterval: int as RotationInterval })}
                    className={`chip-press py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                      settings.defaultInterval === int
                        ? 'bg-white text-black border-white shadow-sm font-bold'
                        : 'bg-white/[0.05] text-slate-300 border-white/10 hover:bg-white/[0.12] hover:text-white'
                    }`}
                  >
                    {int === '1h' ? 'Hourly' : int === '6h' ? '6 Hours' : int === '12h' ? '12 Hours' : 'Daily'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: STORAGE & BACKUP */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-white uppercase tracking-wider block">
              Storage &amp; Backup
            </span>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                <span className="text-[11px] text-slate-400 block mb-1">Active Widgets</span>
                <span className="text-lg font-bold font-mono text-white tabular-nums">{widgets.length}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                <span className="text-[11px] text-slate-400 block mb-1">Cached Photos</span>
                <span className="text-lg font-bold font-mono text-white tabular-nums">{totalPhotos}</span>
              </div>
            </div>

            {/* Export & Import Buttons with Frosted Glass Styling */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={handleExport}
                className="btn-press flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.14] border border-white/20 text-xs font-semibold text-white transition-colors shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
              >
                <div className="w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                  <Download className="w-3.5 h-3.5 text-white" />
                </div>
                <span>Export Backup (JSON)</span>
              </button>

              <label className="btn-press flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.14] border border-white/20 text-xs font-semibold text-white transition-colors cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                <div className="w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                  <Upload className="w-3.5 h-3.5 text-white" />
                </div>
                <span>Restore Backup (JSON)</span>
                <input
                  type="file"
                  accept="application/json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>

            {importSuccess && (
              <div className="p-2.5 rounded-xl bg-white/[0.08] border border-white/30 text-white text-xs flex items-center gap-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]">
                <Check className="w-4 h-4 text-white" />
                <span>Widgets restored successfully!</span>
              </div>
            )}

            {importError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>{importError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="p-2.5 rounded-xl bg-white/[0.08] border border-white/30 text-white text-xs flex items-center gap-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]">
                <Check className="w-4 h-4 text-white" />
                <span>Default presets restored!</span>
              </div>
            )}
          </div>

          {/* SECTION 3: ABOUT GLASS WIDGETS & DEVELOPER INFORMATION */}
          <div className="space-y-3.5">
            <span className="text-[11px] font-bold text-white uppercase tracking-wider block">
              About Glass Widgets
            </span>

            {/* About Card - Pure Monochrome Obsidian Glass */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/15 space-y-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center gap-3">
                <AppLogo size="sm" />
                <div>
                  <h4 className="text-sm font-extrabold text-white tracking-tight">Glass Widgets</h4>
                  <p className="text-[11px] text-neutral-400 font-medium">OLED Minimal Edition</p>
                </div>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed space-y-2.5 pt-1">
                <p>
                  Glass Widgets was created to make Android home screens more personal, beautiful, and meaningful. Its purpose is to help users turn their favourite memories into elegant photo widgets with simple customization, smooth animations, and a clean, distraction-free experience.
                </p>
                <p>
                  Designed with attention to detail, Glass Widgets combines minimal aesthetics with practical functionality, giving users a simple way to personalize their devices and keep their favourite moments close.
                </p>
              </div>

              {/* Developer Badge Card */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                    Developer
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-white">
                    Rudra Pratap Singh Deshmukh
                  </span>
                </div>
                <span className="text-[11px] font-mono text-white/90 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                  Creator
                </span>
              </div>
            </div>

            {/* Privacy Guarantee */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/15 flex items-start gap-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div className="text-xs text-slate-300 leading-relaxed">
                <p className="font-semibold text-white mb-0.5">100% On-Device &amp; Private</p>
                <p className="text-[11px] text-slate-400">
                  Glass Widgets stores all photos and configurations strictly on your local device. No user accounts, internet servers, tracking, or ads.
                </p>
              </div>
            </div>

            {/* Reset to defaults trigger */}
            <div className="pt-2 border-t border-white/10">
              {!showResetConfirm ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-white">Reset Widget Gallery</p>
                    <p className="text-[11px] text-slate-400">Clear widget dashboard to a fresh slate</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    className="btn-press min-h-[40px] flex items-center gap-2 py-2 px-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/20 text-white text-xs font-semibold transition-colors shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-white" />
                    <span>Reset</span>
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Replace all widgets with default presets?</span>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(false)}
                      className="btn-press min-h-[38px] px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteReset}
                      disabled={isResetting}
                      className="btn-press min-h-[38px] px-4 py-1.5 rounded-xl bg-white text-black hover:bg-slate-200 text-xs font-black shadow-md disabled:opacity-50"
                    >
                      Confirm Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-white/10 bg-[#000000] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="btn-press min-h-[44px] flex items-center gap-2 px-3 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Close Settings</span>
          </button>
          <span className="text-[11px] text-slate-500 font-mono">Glass Widgets</span>
        </div>
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
};
