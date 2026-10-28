import React, { useState } from 'react';
import { WidgetConfig } from '../types/widget';
import { WidgetPreview } from './WidgetPreview';
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Compass,
  Camera,
  RotateCw,
  ChevronDown,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LauncherSimulatorProps {
  widget: WidgetConfig;
  allWidgets?: WidgetConfig[];
  onSelectWidget?: (w: WidgetConfig) => void;
  onCyclePhoto: (id: string) => void;
  onBack: () => void;
}

const WALLPAPERS = [
  {
    id: 'amoled_black',
    name: 'AMOLED Pure Black (Pixels Off)',
    background: '#000000',
  },
  {
    id: 'obsidian_dark',
    name: 'Obsidian Minimal',
    background: 'radial-gradient(circle at 50% 25%, #141414 0%, #080808 60%, #000000 100%)',
  },
  {
    id: 'anime_sky',
    name: 'Anime Sky Gradient',
    background: 'linear-gradient(180deg, #74a9eb 0%, #a8ccf8 35%, #ffd4de 70%, #d8c8ea 100%)',
  },
  {
    id: 'deep_slate',
    name: 'Deep Midnight Slate',
    background: 'linear-gradient(180deg, #111827 0%, #030712 100%)',
  },
  {
    id: 'cozy_warm',
    name: 'Warm Twilight',
    background: 'radial-gradient(ellipse at 70% 30%, #201824 0%, #0e0c12 50%, #000000 100%)',
  },
];

export const LauncherSimulator: React.FC<LauncherSimulatorProps> = ({
  widget,
  allWidgets = [],
  onSelectWidget,
  onCyclePhoto,
  onBack,
}) => {
  const [selectedWallpaper, setSelectedWallpaper] = useState(WALLPAPERS[0]);
  const [widgetGridSize, setWidgetGridSize] = useState<'2x2' | '4x2' | '4x4'>('4x2');

  const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateString = new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  const [isWidgetSelectorOpen, setIsWidgetSelectorOpen] = useState(false);

  return (
    <div
      className="flex flex-col lg:flex-row items-center justify-center min-h-[calc(100vh-64px)] p-3 sm:p-6 gap-5 max-w-6xl mx-auto select-none gpu-60fps"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)',
      }}
    >
      {/* Left Sidebar Controls - OLED Black with Frosted Glass Borders */}
      <div className="w-full lg:w-80 flex flex-col gap-4 text-left order-2 lg:order-1">
        <div className="rounded-3xl bg-[#000000] border border-white/20 p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,1)] gpu-60fps">
          <div className="flex items-center justify-between mb-4">
            {/* Prominent Back Button with Glass Effect */}
            <button
              type="button"
              onClick={onBack}
              className="btn-press min-h-[44px] flex items-center gap-2 text-xs sm:text-sm font-bold text-white py-2.5 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.18] border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
              <span>Back to Gallery</span>
            </button>
            <span className="text-[11px] font-mono text-white bg-white/10 px-2.5 py-1 rounded-full border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
              60 FPS Simulator
            </span>
          </div>

          <h2 className="text-xl font-extrabold text-white tracking-tight mb-1.5">
            Home Screen Preview
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
            Preview how your widgets appear directly on an Android Home Screen with responsive sizes and wallpapers.
          </p>

          {/* Widget Instance Selector - Pure AMOLED Obsidian Glass Dropdown (No Chrome Popup) */}
          {allWidgets.length > 1 && (
            <div className="mb-4 relative">
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Current Widget:
              </label>
              <button
                type="button"
                onClick={() => setIsWidgetSelectorOpen(!isWidgetSelectorOpen)}
                className="btn-press w-full min-h-[48px] bg-[#000000] hover:bg-white/[0.05] border border-white/25 hover:border-white/40 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white flex items-center justify-between shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.15)] transition-colors"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="font-bold truncate text-white">{widget.name}</span>
                  <span className="text-[11px] text-slate-400 font-mono bg-white/10 px-2 py-0.5 rounded-full border border-white/10 shrink-0">
                    {widget.photos.length} {widget.photos.length === 1 ? 'photo' : 'photos'}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-300 shrink-0 transition-transform duration-200 ${isWidgetSelectorOpen ? 'rotate-180 text-white' : ''}`} />
              </button>

              {/* AMOLED Black Dropdown Menu with Spring Animation */}
              <AnimatePresence>
                {isWidgetSelectorOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-[#000000] border border-white/25 rounded-2xl p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.95)] backdrop-blur-2xl max-h-56 overflow-y-auto gpu-60fps"
                  >
                    {allWidgets.map((w) => {
                      const isSelected = w.id === widget.id;
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => {
                            if (onSelectWidget) onSelectWidget(w);
                            setIsWidgetSelectorOpen(false);
                          }}
                          className={`chip-press w-full min-h-[44px] px-3 py-2.5 rounded-xl flex items-center justify-between text-left text-xs sm:text-sm transition-colors my-0.5 ${
                            isSelected
                              ? 'bg-white/15 text-white font-bold border border-white/20 shadow-inner'
                              : 'text-slate-200 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <div className="w-2.5 h-2.5 rounded-full border border-white/40 shrink-0 bg-white/20" />
                            <span className="truncate">{w.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">
                              ({w.photos.length})
                            </span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-white shrink-0 ml-2 stroke-[2.5]" />}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Launcher Size Selector */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Widget Size:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['2x2', '4x2', '4x4'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setWidgetGridSize(s)}
                  className={`chip-press min-h-[46px] py-2.5 px-3 flex items-center justify-center text-xs sm:text-sm font-bold rounded-xl border transition-all ${
                    widgetGridSize === s
                      ? 'bg-white text-black border-white shadow-md'
                      : 'bg-white/[0.05] text-slate-300 border-white/10 hover:bg-white/[0.12] hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Wallpaper Picker */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Launcher Wallpaper:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {WALLPAPERS.map((wp) => (
                <button
                  key={wp.id}
                  type="button"
                  onClick={() => setSelectedWallpaper(wp)}
                  className={`card-press min-h-[46px] flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                    selectedWallpaper.id === wp.id
                      ? 'bg-white/15 border-white shadow-sm'
                      : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08]'
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-md border border-white/25 shrink-0"
                    style={{ background: wp.background }}
                  />
                  <span className="text-xs font-medium text-slate-200 truncate">
                    {wp.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tap Action Helper */}
          <div className="pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => onCyclePhoto(widget.id)}
              className="btn-press w-full min-h-[48px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white text-black font-extrabold text-xs sm:text-sm shadow-md transition-all hover:bg-slate-200"
            >
              <RotateCw className="w-4 h-4" />
              <span>Tap Widget to Cycle Photo ({widget.activePhotoIndex + 1}/{widget.photos.length || 1})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right / Center Phone Frame Display - OLED Black Frame with 60 FPS Compositor */}
      <div className="relative order-1 lg:order-2 gpu-60fps">
        <div className="relative w-[340px] sm:w-[380px] h-[700px] sm:h-[740px] bg-[#000000] rounded-[48px] p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,1)] ring-1 ring-white/20 border border-white/25 flex flex-col overflow-hidden gpu-60fps">
          {/* Top Speaker Ear-piece */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-neutral-800 rounded-full z-40" />

          {/* Phone Screen Canvas */}
          <div
            className="relative w-full h-full rounded-[40px] overflow-hidden flex flex-col justify-between text-white"
            style={{
              background: selectedWallpaper.background,
            }}
          >
            {/* Front Camera Hole Punch - Exactly Centered */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rounded-full ring-2 ring-black/90 flex items-center justify-center z-40 pointer-events-none shadow-sm">
              <div className="w-1.5 h-1.5 bg-neutral-900 rounded-full" />
            </div>

            {/* Android Status Bar */}
            <div className="relative z-30 pt-2.5 px-6 flex items-center justify-between text-[11px] font-semibold tracking-tight text-white/90">
              <span className="font-mono">{timeString}</span>

              {/* Status Icons */}
              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                <span>VoLTE</span>
                <span>5G</span>
                <span className="bg-white text-black text-[9px] font-bold px-1 rounded-sm">100%</span>
              </div>
            </div>

            {/* Google Pixel Style "At a Glance" & Clock UI */}
            <div className="relative z-20 px-6 pt-3 flex flex-col items-center">
              {/* Pixel "At a Glance" Pill */}
              <div className="flex items-center gap-2 text-xs font-medium text-white/95 bg-black/40 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/15 shadow-sm">
                <span>{dateString}</span>
                <span className="w-1 h-1 rounded-full bg-white/40" />
                <span>24°C ☀️ Sunny</span>
              </div>

              {/* Pixel Big Digital Clock Typography */}
              <div className="text-5xl font-extralight tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] mt-1.5 font-['Plus_Jakarta_Sans',sans-serif]">
                {timeString}
              </div>
            </div>

            {/* Center: The Glass Photo Widget */}
            <div className="relative z-20 px-5 flex-1 flex flex-col items-center justify-center">
              <div
                className={`transition-all duration-300 w-full flex flex-col items-center justify-center ${
                  widgetGridSize === '2x2'
                    ? 'max-w-[160px]'
                    : widgetGridSize === '4x2'
                    ? 'max-w-[280px]'
                    : 'max-w-[300px]'
                }`}
              >
                {/* Touch hint indicator */}
                <div className="mb-2 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-[10px] text-white shadow-sm">
                  <RotateCw className="w-2.5 h-2.5 text-white" />
                  <span>Tap to rotate photo</span>
                </div>

                <div
                  onClick={() => onCyclePhoto(widget.id)}
                  className="card-press cursor-pointer"
                  title="Tap to cycle photo"
                >
                  <WidgetPreview
                    widget={widget}
                    size={widgetGridSize === '2x2' ? 'sm' : widgetGridSize === '4x2' ? 'md' : 'lg'}
                    interactive={true}
                    onCyclePhoto={() => onCyclePhoto(widget.id)}
                  />
                </div>

                <span className="text-[12px] font-medium text-white/95 mt-2.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] tracking-tight">
                  {widget.name || 'Glass Widget'}
                </span>
              </div>
            </div>

            {/* Android Launcher Dock (Frosted Glass Search Bar + 4 Glass App Icons) */}
            <div className="relative z-20 px-5 pb-5 flex flex-col gap-3">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-full py-2 px-4 flex items-center justify-between text-xs text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                <span className="font-medium text-white/80">Search...</span>
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white border border-white/20">
                  G
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 px-2">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.08] backdrop-blur-xl flex items-center justify-center text-white shadow-md border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]">
                    <Phone className="w-5 h-5" />
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.08] backdrop-blur-xl flex items-center justify-center text-white shadow-md border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.08] backdrop-blur-xl flex items-center justify-center text-white shadow-md border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]">
                    <Compass className="w-5 h-5" />
                  </div>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.08] backdrop-blur-xl flex items-center justify-center text-white shadow-md border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]">
                    <Camera className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="w-28 h-1 bg-white/70 rounded-full mx-auto mt-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
