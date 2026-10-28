import React, { useState } from 'react';
import { WidgetConfig } from '../types/widget';
import { WidgetPreview } from './WidgetPreview';
import { AppLogo } from './AppLogo';
import { SHAPE_DEFINITIONS } from '../utils/shapes';
import {
  Settings,
  Plus,
  Sliders,
  HelpCircle,
  Smartphone,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  RotateCw,
  X,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HomeScreenProps {
  widgets: WidgetConfig[];
  onOpenCreate: () => void;
  onEditWidget: (w: WidgetConfig) => void;
  onDeleteWidget: (id: string) => void;
  onDuplicateWidget: (id: string) => void;
  onRotatePhoto: (id: string) => void;
  onOpenSimulator: (w?: WidgetConfig) => void;
  onOpenSettings: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  widgets,
  onOpenCreate,
  onEditWidget,
  onDeleteWidget,
  onDuplicateWidget,
  onRotatePhoto,
  onOpenSimulator,
  onOpenSettings,
}) => {
  const [activeMenuWidgetId, setActiveMenuWidgetId] = useState<string | null>(null);
  const [showHowToAddModal, setShowHowToAddModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const totalPhotos = widgets.reduce((sum, w) => sum + (w.photos?.length || 0), 0);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-black text-white relative px-4 sm:px-6 pb-24 pt-[max(env(safe-area-inset-top,8px),8px)]">
      {/* Top Header - Compact, tightly aligned just below the real Android status bar */}
      <header className="flex items-center justify-between gap-2 py-2 mb-3">
        {/* Left: Authentic Glass Widgets Logo & App Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl overflow-hidden bg-black border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.8)] shrink-0 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Glass Widgets"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-tight truncate">
              Glass Widgets
            </h1>
            <p className="text-[11px] text-neutral-400 font-medium leading-none truncate">
              {widgets.length} {widgets.length === 1 ? 'Widget' : 'Widgets'} • {totalPhotos} {totalPhotos === 1 ? 'Photo' : 'Photos'}
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenSettings}
            className="btn-press min-h-[38px] px-3.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-neutral-300" />
            <span>Settings</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreate}
            className="btn-press min-h-[38px] px-4 py-1.5 rounded-full bg-white hover:bg-neutral-200 text-black text-xs font-bold flex items-center gap-1.5 shadow-[0_2px_12px_rgba(255,255,255,0.25)] transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-black stroke-[3]" />
            <span>New</span>
          </button>
        </div>
      </header>

      {/* Navigation Quick Action Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 mb-5">
        <button
          type="button"
          onClick={onOpenSettings}
          className="btn-press shrink-0 px-3.5 py-2 rounded-full bg-neutral-900/90 border border-white/10 text-neutral-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Preferences</span>
        </button>

        <button
          type="button"
          onClick={() => setShowHowToAddModal(true)}
          className="btn-press shrink-0 px-3.5 py-2 rounded-full bg-neutral-900/90 border border-white/10 text-neutral-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>How to Add</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenSimulator()}
          className="btn-press shrink-0 px-3.5 py-2 rounded-full bg-neutral-900/90 border border-white/10 text-neutral-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Launcher Simulator</span>
        </button>
      </div>

      {/* Saved Widgets Section Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Saved Widgets
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-neutral-900 border border-white/10 text-[11px] font-semibold text-neutral-400">
            {widgets.length}
          </span>
        </div>
      </div>

      {/* Saved Widgets Grid / Empty State */}
      {widgets.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-3xl border border-dashed border-white/15 bg-neutral-950/50 text-center my-auto min-h-[380px]">
          {/* Authentic Logo artwork inside a selected widget shape with clean OLED black background */}
          <div className="relative mb-5 w-24 h-24 rounded-3xl bg-black border border-white/20 p-2 shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center justify-center overflow-hidden">
            <img
              src="/logo.png"
              alt="Glass Widgets Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <h3 className="text-lg font-extrabold text-white mb-2 tracking-tight">
            No Widgets Yet
          </h3>
          <p className="text-xs text-neutral-400 max-w-xs leading-relaxed mb-6">
            Create your first glassmorphic photo widget with custom frames, borders, color filters, and photo rotations.
          </p>

          <button
            type="button"
            onClick={onOpenCreate}
            className="btn-press px-6 py-3 rounded-full bg-white hover:bg-neutral-200 text-black text-xs font-bold flex items-center gap-2 shadow-[0_4px_20px_rgba(255,255,255,0.2)] transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create Widget</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {widgets.map((w) => {
            const shapeInfo = SHAPE_DEFINITIONS[w.frameShape] || SHAPE_DEFINITIONS.rounded_square;
            const photoCount = w.photos?.length || 0;
            const isMenuOpen = activeMenuWidgetId === w.id;

            return (
              <div
                key={w.id}
                className="card-press relative rounded-3xl bg-neutral-950/70 border border-white/10 hover:border-white/25 p-4 flex flex-col justify-between transition-all group overflow-hidden shadow-lg"
              >
                {/* Subtle specular rim light */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                {/* Top Card Bar: Name, Shape & Menu */}
                <div className="flex items-center justify-between gap-2 mb-3 z-10">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-white transition-colors">
                      {w.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-medium">
                      <span className="capitalize">{shapeInfo.label}</span>
                      <span>•</span>
                      <span>{photoCount} {photoCount === 1 ? 'photo' : 'photos'}</span>
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveMenuWidgetId(isMenuOpen ? null : w.id)}
                      className="icon-btn-press w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
                      title="Widget options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Popover Dropdown Menu */}
                    <AnimatePresence>
                      {isMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setActiveMenuWidgetId(null)}
                          />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-9 z-40 w-44 rounded-2xl bg-neutral-900 border border-white/15 p-1.5 shadow-2xl space-y-1"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuWidgetId(null);
                                onEditWidget(w);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-xs text-white font-medium transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-neutral-300" />
                              <span>Edit Widget</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuWidgetId(null);
                                onDuplicateWidget(w.id);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-xs text-white font-medium transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5 text-neutral-300" />
                              <span>Duplicate</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuWidgetId(null);
                                onOpenSimulator(w);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-xs text-white font-medium transition-colors"
                            >
                              <Smartphone className="w-3.5 h-3.5 text-neutral-300" />
                              <span>View in Simulator</span>
                            </button>
                            <div className="h-[1px] bg-white/10 my-1" />
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuWidgetId(null);
                                setDeleteConfirmId(w.id);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-500/20 text-xs text-red-400 font-medium transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Widget</span>
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Widget Center Preview */}
                <div
                  className="py-4 flex items-center justify-center cursor-pointer"
                  onClick={() => onEditWidget(w)}
                >
                  <WidgetPreview
                    widget={w}
                    size="md"
                    interactive={false}
                  />
                </div>

                {/* Bottom Quick Controls */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/5 mt-1 z-10">
                  <button
                    type="button"
                    onClick={() => onRotatePhoto(w.id)}
                    disabled={photoCount <= 1}
                    className="icon-btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-xs text-neutral-300 border border-white/5 transition-colors"
                    title="Rotate photo"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Next Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditWidget(w)}
                    className="btn-press flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/15 text-xs text-white font-semibold border border-white/15 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Customize</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Bottom "+ New Widget" Button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
        <button
          type="button"
          onClick={onOpenCreate}
          className="btn-press px-6 py-3 rounded-full bg-white hover:bg-neutral-200 text-black font-extrabold text-sm flex items-center gap-2 shadow-[0_8px_30px_rgba(255,255,255,0.3)] transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Widget</span>
        </button>
      </div>

      {/* "How to Add" Setup Modal */}
      <AnimatePresence>
        {showHowToAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-md rounded-3xl bg-neutral-950 border border-white/15 p-6 shadow-2xl flex flex-col space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-black border border-white/20 p-1 flex items-center justify-center">
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">Setup Your Widget</h3>
                    <p className="text-[11px] text-neutral-400">Android Home Screen Guide</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHowToAddModal(false)}
                  className="icon-btn-press w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 py-1 text-xs text-neutral-300">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                  <span className="w-5 h-5 rounded-full bg-white text-black font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                  <p>Touch and hold any empty area on your Android home screen until the menu appears.</p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                  <span className="w-5 h-5 rounded-full bg-white text-black font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                  <p>Tap <strong className="text-white">Widgets</strong> from the popup menu options.</p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                  <span className="w-5 h-5 rounded-full bg-white text-black font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                  <p>Find <strong className="text-white">Glass Widgets</strong> in the list of installed widget apps.</p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                  <span className="w-5 h-5 rounded-full bg-white text-black font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
                  <p>Touch, hold, and drag your chosen widget size onto your home screen.</p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                  <span className="w-5 h-5 rounded-full bg-white text-black font-bold flex items-center justify-center shrink-0 text-[11px]">5</span>
                  <p>Select which saved collection to link, then enjoy your glowing glassmorphic widget!</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowHowToAddModal(false)}
                className="btn-press w-full py-2.5 rounded-full bg-white text-black font-bold text-xs shadow-md transition-colors"
              >
                Got It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-3xl bg-neutral-950 border border-white/20 p-5 shadow-2xl space-y-4"
            >
              <h3 className="text-sm font-bold text-white">Delete this widget?</h3>
              <p className="text-xs text-neutral-400">
                This will remove the widget configuration from your list. Any photos saved in this widget will no longer appear on your launcher.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="btn-press flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (deleteConfirmId) {
                      onDeleteWidget(deleteConfirmId);
                      setDeleteConfirmId(null);
                    }
                  }}
                  className="btn-press flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
