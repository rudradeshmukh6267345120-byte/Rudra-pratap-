import React, { useState, useRef } from 'react';
import {
  WidgetConfig,
  FrameShape,
  FilterTone,
  TextureType,
  RotationInterval,
  RotationOrder,
  WidgetPhoto,
  PhotoTransform,
  PhotoLayout,
  DEFAULT_PHOTO_TRANSFORM,
} from '../types/widget';
import { SHAPE_DEFINITIONS } from '../utils/shapes';
import { FILTER_DEFINITIONS, TEXTURE_DEFINITIONS } from '../utils/filters';
import { storePhotoData, getSavedWidgets } from '../utils/storage';
import { WidgetPreview } from './WidgetPreview';
import {
  ArrowLeft,
  X,
  Check,
  Image as ImageIcon,
  Shapes,
  Palette,
  Sparkles,
  Clock,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Layers,
  Sliders,
  Eye,
  Camera,
  SunMoon,
  Move,
  ZoomIn,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Maximize2,
  Minimize2,
  RefreshCw,
  Grid2X2,
  Columns,
  Rows,
  Square as SquareIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WidgetEditorProps {
  widget?: WidgetConfig | null;
  onSave: (widget: WidgetConfig) => void;
  onCancel: () => void;
}

type TabType = 'photos' | 'adjust' | 'frame' | 'border' | 'filters' | 'textures' | 'schedule';

const PRESET_BORDER_COLORS = [
  '#ffffff', // Pure White
  '#f1f5f9', // Frosted White
  '#e2e8f0', // Silver Chrome
  '#94a3b8', // Slate Mist
  '#64748b', // Obsidian Steel
  'rgba(255, 255, 255, 0.5)', // Frosted Glass Specular
  'rgba(255, 255, 255, 0.25)', // Subtle Glass Rim
  '#10b981', // Emerald
];

export const WidgetEditor: React.FC<WidgetEditorProps> = ({
  widget,
  onSave,
  onCancel,
}) => {
  const isEditing = Boolean(widget);

  // Editor Draft State
  const [name, setName] = useState(widget?.name || 'New Widget');
  const [photos, setPhotos] = useState<WidgetPhoto[]>(
    widget?.photos && widget.photos.length > 0 ? widget.photos : []
  );
  const [activePhotoIndex, setActivePhotoIndex] = useState(widget?.activePhotoIndex || 0);
  const [frameShape, setFrameShape] = useState<FrameShape>(widget?.frameShape || 'rounded_square');
  const [layout, setLayout] = useState<PhotoLayout>(widget?.layout || 'single');
  const [layoutSpacing, setLayoutSpacing] = useState<number>(widget?.layoutSpacing !== undefined ? widget.layoutSpacing : 2);
  const [showTitleOnHome, setShowTitleOnHome] = useState<boolean>(widget?.showTitleOnHome ?? false);

  const [borderEnabled, setBorderEnabled] = useState(widget?.border.enabled ?? true);
  const [borderColor, setBorderColor] = useState(widget?.border.color || '#ffffff');
  const [borderWidth, setBorderWidth] = useState(widget?.border.width ?? 3);
  const [borderGlow, setBorderGlow] = useState(widget?.border.glow ?? true);
  const [glowIntensity, setGlowIntensity] = useState<number>(widget?.border.glowIntensity !== undefined ? widget.border.glowIntensity : 60);

  const [filterTone, setFilterTone] = useState<FilterTone>(widget?.filter.tone || 'original');
  const [filterIntensity, setFilterIntensity] = useState(widget?.filter.intensity ?? 100);

  const [textureType, setTextureType] = useState<TextureType>(widget?.texture.type || 'none');
  const [textureIntensity, setTextureIntensity] = useState(widget?.texture.intensity ?? 40);

  const [rotationInterval, setRotationInterval] = useState<RotationInterval>(
    widget?.schedule.interval || '24h'
  );
  const [rotationOrder, setRotationOrder] = useState<RotationOrder>(
    widget?.schedule.order || 'sequential'
  );
  const [moodRotation, setMoodRotation] = useState(widget?.schedule.moodRotation ?? false);

  const [activeTab, setActiveTab] = useState<TabType>('photos');
  const [editorToast, setEditorToast] = useState<string | null>(null);
  const [showSavedPhotosModal, setShowSavedPhotosModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dragging state for interactive photo pan
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; initX: number; initY: number } | null>(null);

  // Active Photo & its Transform
  const currentPhoto = photos[activePhotoIndex] || photos[0];
  const currentTransform: PhotoTransform = currentPhoto?.transform || DEFAULT_PHOTO_TRANSFORM;
  const [transformHistory, setTransformHistory] = useState<PhotoTransform[]>([]);
  const [isComparingOriginal, setIsComparingOriginal] = useState(false);

  const updateCurrentTransform = (updates: Partial<PhotoTransform>, recordHistory: boolean = true) => {
    if (!currentPhoto) return;
    if (recordHistory) {
      setTransformHistory((prev) => [...prev.slice(-15), currentTransform]);
    }
    const updatedTransform: PhotoTransform = {
      ...currentTransform,
      ...updates,
    };

    setPhotos((prev) =>
      prev.map((p, idx) =>
        idx === activePhotoIndex ? { ...p, transform: updatedTransform } : p
      )
    );
  };

  const handleUndoTransform = () => {
    if (transformHistory.length === 0) {
      showToast('No more adjustments to undo');
      return;
    }
    const prevTransform = transformHistory[transformHistory.length - 1];
    setTransformHistory((prev) => prev.slice(0, -1));
    updateCurrentTransform(prevTransform, false);
    showToast('Reverted to previous adjustment');
  };

  const handleResetTransform = () => {
    setTransformHistory((prev) => [...prev.slice(-15), currentTransform]);
    updateCurrentTransform(DEFAULT_PHOTO_TRANSFORM, false);
    showToast('Photo position and adjustments reset');
  };

  // Collect distinct photos from existing widgets in local storage
  const existingSavedPhotos = React.useMemo(() => {
    const all = getSavedWidgets();
    const map = new Map<string, WidgetPhoto>();
    all.forEach((w) => {
      (w.photos || []).forEach((p) => {
        if (p && p.url && !map.has(p.url)) {
          map.set(p.url, p);
        }
      });
    });
    return Array.from(map.values());
  }, []);

  const handleAddSavedPhoto = (savedPhoto: WidgetPhoto) => {
    const alreadyExists = photos.some((p) => p.url === savedPhoto.url);
    if (alreadyExists) {
      showToast(`Photo "${savedPhoto.name}" is already in this widget`);
      return;
    }
    const newPhoto: WidgetPhoto = {
      id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: savedPhoto.name,
      url: savedPhoto.url,
      addedAt: Date.now(),
      transform: savedPhoto.transform || { ...DEFAULT_PHOTO_TRANSFORM },
    };
    setPhotos((prev) => [...prev, newPhoto]);
    showToast(`Added "${savedPhoto.name || 'Photo'}"`);
  };

  const showToast = (msg: string) => {
    setEditorToast(msg);
    setTimeout(() => {
      setEditorToast(null);
    }, 2500);
  };

  // Current draft config for live preview
  const draftWidget: WidgetConfig = {
    id: widget?.id || `widget-${Date.now()}`,
    name: name.trim() || 'New Widget',
    photos: isComparingOriginal
      ? photos.map((p, idx) => (idx === activePhotoIndex ? { ...p, transform: { ...DEFAULT_PHOTO_TRANSFORM } } : p))
      : photos,
    activePhotoIndex: photos.length > 0 ? Math.min(activePhotoIndex, photos.length - 1) : 0,
    frameShape,
    layout,
    layoutSpacing,
    showTitleOnHome,
    border: {
      enabled: borderEnabled,
      color: borderColor,
      width: borderWidth,
      glow: borderGlow,
      glowIntensity,
    },
    filter: {
      tone: filterTone,
      intensity: filterIntensity,
    },
    texture: {
      type: textureType,
      intensity: textureIntensity,
    },
    schedule: {
      interval: rotationInterval,
      order: rotationOrder,
      moodRotation,
    },
    aspectRatio: '1:1',
    createdAt: widget?.createdAt || Date.now(),
    updatedAt: Date.now(),
  };

  // Handle Photo File Uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        const newPhotoId = `photo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        await storePhotoData(newPhotoId, dataUrl);

        const newPhoto: WidgetPhoto = {
          id: newPhotoId,
          name: file.name,
          url: dataUrl,
          addedAt: Date.now(),
          transform: { ...DEFAULT_PHOTO_TRANSFORM },
        };

        setPhotos((prev) => [...prev, newPhoto]);
        showToast(`Added "${file.name}"`);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    const removedName = photos[index]?.name || 'Photo';
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    if (activePhotoIndex >= index && activePhotoIndex > 0) {
      setActivePhotoIndex((prev) => prev - 1);
    }
    showToast(`Removed "${removedName}"`);
  };

  const handleMovePhoto = (from: number, to: number) => {
    if (to < 0 || to >= photos.length) return;
    setPhotos((prev) => {
      const copy = [...prev];
      const item = copy.splice(from, 1)[0];
      copy.splice(to, 0, item);
      return copy;
    });
  };

  const isSavingRef = useRef(false);

  const handleSave = () => {
    if (isSavingRef.current) return;
    if (photos.length === 0) {
      showToast('Please add at least one photo for your widget');
      return;
    }
    isSavingRef.current = true;
    onSave(draftWidget);
  };

  // Touch and Mouse handlers for interactive preview dragging
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!currentPhoto) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = {
      clientX,
      clientY,
      initX: currentTransform.offsetX,
      initY: currentTransform.offsetY,
    };
    setIsDraggingPhoto(true);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDraggingPhoto || !dragStartRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const dx = clientX - dragStartRef.current.clientX;
    const dy = clientY - dragStartRef.current.clientY;

    // Convert pixels to percentage pan offset (sensitivity tuned for responsiveness)
    const factor = 0.35;
    const newX = Math.round(Math.max(-75, Math.min(75, dragStartRef.current.initX + dx * factor)));
    const newY = Math.round(Math.max(-75, Math.min(75, dragStartRef.current.initY + dy * factor)));

    updateCurrentTransform({ offsetX: newX, offsetY: newY });
  };

  const handleDragEnd = () => {
    setIsDraggingPhoto(false);
    dragStartRef.current = null;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] flex flex-col overflow-hidden text-slate-100 select-none gpu-60fps">
      {/* Top Navigation Bar - Pure OLED Black with Glass Border */}
      <div
        className="px-4 sm:px-6 py-2.5 sm:py-3 border-b border-white/10 flex items-center justify-between bg-[#000000]/95 backdrop-blur-xl shrink-0 z-20 gpu-60fps"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 8px), 8px)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn-press min-h-[40px] flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.18] border border-white/20 text-white font-bold text-xs sm:text-sm group shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
            title="Back to Gallery"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back</span>
          </button>

          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-none">
              {isEditing ? 'Edit Widget' : 'New Widget'}
            </h2>
            <span className="text-[10px] text-neutral-400 font-medium">
              {photos.length} {photos.length === 1 ? 'photo' : 'photos'} • {frameShape}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="btn-press min-h-[40px] flex items-center gap-2 px-5 py-2 rounded-full bg-white text-black hover:bg-neutral-200 font-extrabold text-xs sm:text-sm shadow-[0_2px_14px_rgba(255,255,255,0.3)] transition-all"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Save Changes</span>
        </button>
      </div>

      {/* Main Split Layout: Left Preview / Right Tabs */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left / Upper Interactive Preview Area */}
        <div className="w-full md:w-[380px] lg:w-[420px] p-4 sm:p-6 border-b md:border-b-0 md:border-r border-white/10 flex flex-col items-center justify-center bg-[#050505] shrink-0 overflow-y-auto no-scrollbar">
          <div className="relative flex flex-col items-center w-full max-w-[280px]">
            {/* Draggable preview wrapper */}
            <div
              onMouseDown={handleDragStart}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
              className={`relative cursor-${activeTab === 'adjust' ? (isDraggingPhoto ? 'grabbing' : 'grab') : 'pointer'} touch-none`}
            >
              <WidgetPreview
                widget={draftWidget}
                size="md"
                interactive={activeTab !== 'adjust'}
                highlightBorder={activeTab === 'border'}
                showCropGrid={activeTab === 'adjust'}
                onCyclePhoto={() => {
                  if (photos.length > 1) {
                    setActivePhotoIndex((prev) => (prev + 1) % photos.length);
                  }
                }}
              />

              {/* Drag overlay hint when in Adjust tab */}
              {activeTab === 'adjust' && currentPhoto && (
                <div className="absolute inset-0 pointer-events-none rounded-3xl border border-dashed border-white/30 flex items-center justify-center bg-black/10">
                  <div className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-[10px] text-white flex items-center gap-1.5 shadow-lg">
                    <Move className="w-3 h-3 text-neutral-300" />
                    <span>Drag to pan photo</span>
                  </div>
                </div>
              )}
            </div>

            {/* Live Preview Indicator */}
            <div className="mt-3.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.08] border border-white/20 text-[11px] text-white shadow-inner">
              <Eye className="w-3.5 h-3.5 text-white" />
              <span>Live Preview {photos.length > 1 ? '· Tap to cycle' : ''}</span>
            </div>

            {/* Widget Name Input */}
            <div className="w-full mt-3.5 relative">
              <label className="absolute -top-2 left-3 px-1.5 bg-[#050505] text-[10px] font-semibold text-neutral-300 z-10 rounded">
                Widget Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
                placeholder="My Glass Widget"
                className="w-full bg-black border border-white/20 focus:border-white rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none transition-colors shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Right / Lower Tabbed Customization Panel */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#000000]">
          {/* Segmented Tabs Bar */}
          <div className="flex items-center gap-1 px-4 py-2.5 border-b border-white/10 bg-[#000000] overflow-x-auto no-scrollbar shrink-0">
            {[
              { id: 'photos', label: 'Photos', icon: ImageIcon },
              { id: 'adjust', label: 'Adjust', icon: Move },
              { id: 'frame', label: 'Frames', icon: Shapes },
              { id: 'border', label: 'Borders', icon: Sliders },
              { id: 'filters', label: 'Filters', icon: Palette },
              { id: 'textures', label: 'Textures', icon: Layers },
              { id: 'schedule', label: 'Schedule', icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`btn-press min-h-[38px] flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-white text-black shadow-md font-bold'
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-black' : 'text-neutral-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Container */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
            {/* TAB 1: PHOTOS & LAYOUT */}
            {activeTab === 'photos' && (
              <div className="space-y-6 max-w-xl">
                {/* Header and Add Action */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">Photo Playlist</h3>
                    <p className="text-xs text-neutral-400">
                      Add photos to rotate or arrange in multi-photo layouts.
                    </p>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />

                  <div className="flex items-center gap-2">
                    {existingSavedPhotos.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowSavedPhotosModal(true)}
                        className="btn-press min-h-[38px] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/20 text-white font-bold text-xs transition-colors"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Saved ({existingSavedPhotos.length})</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-press min-h-[38px] flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-black hover:bg-neutral-200 font-bold text-xs shadow-md transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Photos</span>
                    </button>
                  </div>
                </div>

                {/* Multi-Photo Layout Selector */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white block">Photo Layout & Arrangement</span>
                      <span className="text-[11px] text-neutral-400">
                        Choose single or multi-photo collage inside your widget frame
                      </span>
                    </div>
                  </div>

                  {/* 8 Layout Grid Options */}
                  <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                    {[
                      {
                        id: 'single',
                        label: 'Single',
                        renderMini: () => (
                          <div className="w-5 h-5 rounded-sm bg-current opacity-80" />
                        ),
                      },
                      {
                        id: 'row_1x2',
                        label: '2 Side',
                        renderMini: () => (
                          <div className="w-5 h-5 grid grid-cols-2 gap-0.5">
                            <div className="rounded-[1px] bg-current opacity-80" />
                            <div className="rounded-[1px] bg-current opacity-80" />
                          </div>
                        ),
                      },
                      {
                        id: 'col_2x1',
                        label: '2 Stack',
                        renderMini: () => (
                          <div className="w-5 h-5 grid grid-rows-2 gap-0.5">
                            <div className="rounded-[1px] bg-current opacity-80" />
                            <div className="rounded-[1px] bg-current opacity-80" />
                          </div>
                        ),
                      },
                      {
                        id: 'tri_photo',
                        label: '3 Trio',
                        renderMini: () => (
                          <div className="w-5 h-5 grid grid-cols-5 gap-0.5">
                            <div className="col-span-3 rounded-[1px] bg-current opacity-80" />
                            <div className="col-span-2 grid grid-rows-2 gap-0.5">
                              <div className="rounded-[1px] bg-current opacity-80" />
                              <div className="rounded-[1px] bg-current opacity-80" />
                            </div>
                          </div>
                        ),
                      },
                      {
                        id: 'grid_2x2',
                        label: '2x2 Grid',
                        renderMini: () => (
                          <div className="w-5 h-5 grid grid-cols-2 grid-rows-2 gap-0.5">
                            <div className="rounded-[1px] bg-current opacity-80" />
                            <div className="rounded-[1px] bg-current opacity-80" />
                            <div className="rounded-[1px] bg-current opacity-80" />
                            <div className="rounded-[1px] bg-current opacity-80" />
                          </div>
                        ),
                      },
                      {
                        id: 'strip_h',
                        label: 'Strip H',
                        renderMini: () => (
                          <div className="w-5 h-5 grid grid-cols-3 gap-0.5">
                            <div className="rounded-[1px] bg-current opacity-80" />
                            <div className="rounded-[1px] bg-current opacity-80" />
                            <div className="rounded-[1px] bg-current opacity-80" />
                          </div>
                        ),
                      },
                      {
                        id: 'strip_v',
                        label: 'Strip V',
                        renderMini: () => (
                          <div className="w-5 h-5 grid grid-rows-3 gap-0.5">
                            <div className="rounded-[1px] bg-current opacity-80" />
                            <div className="rounded-[1px] bg-current opacity-80" />
                            <div className="rounded-[1px] bg-current opacity-80" />
                          </div>
                        ),
                      },
                      {
                        id: 'tiles_multi',
                        label: '6 Tiles',
                        renderMini: () => (
                          <div className="w-5 h-5 grid grid-cols-3 grid-rows-2 gap-0.5">
                            <div className="rounded-[1px] bg-current opacity-80" />
                            <div className="rounded-[1px] bg-current opacity-80" />
                            <div className="rounded-[1px] bg-current opacity-80" />
                            <div className="rounded-[1px] bg-current opacity-80" />
                            <div className="rounded-[1px] bg-current opacity-80" />
                            <div className="rounded-[1px] bg-current opacity-80" />
                          </div>
                        ),
                      },
                    ].map((opt) => {
                      const isSelected = layout === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setLayout(opt.id as PhotoLayout)}
                          className={`btn-press p-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                            isSelected
                              ? 'bg-white text-black border-white shadow-md ring-1 ring-white/50'
                              : 'bg-white/[0.03] border-white/5 text-neutral-400 hover:text-white hover:bg-white/[0.08]'
                          }`}
                        >
                          <div className="flex items-center justify-center w-5 h-5">
                            {opt.renderMini()}
                          </div>
                          <span className="text-[10px] font-semibold">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Photo Spacing Slider for multi-photo layouts */}
                  {layout !== 'single' && (
                    <div className="pt-2 border-t border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-300">Layout Spacing / Gap</span>
                        <span className="font-mono text-white font-bold">{layoutSpacing}px</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={8}
                        step={1}
                        value={layoutSpacing}
                        onChange={(e) => setLayoutSpacing(Number(e.target.value))}
                        className="w-full accent-white cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Playlist list */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-neutral-300 block">
                    Current Playlist ({photos.length})
                  </span>

                  {photos.length === 0 ? (
                    <div className="p-8 rounded-2xl border border-dashed border-white/15 text-center text-neutral-400 text-xs bg-white/[0.02]">
                      No photos added yet. Tap <strong className="text-white">"Add Photos"</strong> above to select pictures.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {photos.map((p, idx) => (
                        <div
                          key={p.id + idx}
                          onClick={() => {
                            setActivePhotoIndex(idx);
                            setActiveTab('adjust');
                          }}
                          className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                            idx === activePhotoIndex
                              ? 'bg-white/10 border-white/40 ring-1 ring-white/20'
                              : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={p.url}
                              alt={p.name || 'Photo'}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate">
                                {p.name || `Photo #${idx + 1}`}
                              </p>
                              <span className="text-[10px] text-neutral-400">
                                {idx === activePhotoIndex ? (
                                  <span className="text-white font-medium">● Active (Tap to adjust)</span>
                                ) : (
                                  `Index: ${idx + 1}`
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleMovePhoto(idx, idx - 1)}
                              disabled={idx === 0}
                              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-20 text-neutral-300 flex items-center justify-center"
                              title="Move Up"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMovePhoto(idx, idx + 1)}
                              disabled={idx === photos.length - 1}
                              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-20 text-neutral-300 flex items-center justify-center"
                              title="Move Down"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(idx)}
                              className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center ml-1"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: ADVANCED PHOTO ADJUST (PAN, ZOOM, ROTATE, STRAIGHTEN, FLIP, FIT/FILL) */}
            {activeTab === 'adjust' && (
              <div className="space-y-6 max-w-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-white">Photo Position & Adjustments</h3>
                      {isComparingOriginal && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-black animate-pulse">
                          Comparing (Original)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400">
                      Drag preview to pan. Adjust zoom, rotation, tilt, and framing.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onMouseDown={() => setIsComparingOriginal(true)}
                      onMouseUp={() => setIsComparingOriginal(false)}
                      onTouchStart={() => setIsComparingOriginal(true)}
                      onTouchEnd={() => setIsComparingOriginal(false)}
                      className={`btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        isComparingOriginal
                          ? 'bg-white text-black border-white shadow-md'
                          : 'bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white border-white/10'
                      }`}
                      title="Hold to preview unedited original image"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isComparingOriginal ? 'Original' : 'Hold Compare'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleUndoTransform}
                      disabled={transformHistory.length === 0}
                      className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-neutral-300 hover:text-white text-xs font-semibold border border-white/10"
                      title="Undo last photo transform"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Undo</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetTransform}
                      className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white text-xs font-semibold border border-white/10"
                      title="Reset photo position and zoom"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                {!currentPhoto ? (
                  <div className="p-8 rounded-2xl border border-dashed border-white/15 text-center text-neutral-400 text-xs">
                    No active photo to adjust. Add a photo in the Photos tab first.
                  </div>
                ) : (
                  <>
                    {/* Fill vs Fit Mode */}
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                      <span className="text-xs font-semibold text-neutral-300 block">Framing Mode</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => updateCurrentTransform({ fitting: 'fill' })}
                          className={`btn-press p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                            (currentTransform.fitting || 'fill') === 'fill'
                              ? 'bg-white text-black border-white shadow-md'
                              : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                          }`}
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>Fill (Cover Entire Shape)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => updateCurrentTransform({ fitting: 'fit' })}
                          className={`btn-press p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                            currentTransform.fitting === 'fit'
                              ? 'bg-white text-black border-white shadow-md'
                              : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                          }`}
                        >
                          <Minimize2 className="w-3.5 h-3.5" />
                          <span>Fit (Contain Full Image)</span>
                        </button>
                      </div>
                    </div>

                    {/* Zoom / Scale Slider */}
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-semibold text-neutral-300">
                          <ZoomIn className="w-3.5 h-3.5" />
                          <span>Zoom & Scale</span>
                        </div>
                        <span className="font-mono text-white font-bold">
                          {currentTransform.scale.toFixed(2)}x
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updateCurrentTransform({ scale: Math.max(0.5, currentTransform.scale - 0.1) })}
                          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-white flex items-center justify-center text-sm font-bold shrink-0"
                        >
                          -
                        </button>
                        <input
                          type="range"
                          min={0.5}
                          max={3.0}
                          step={0.05}
                          value={currentTransform.scale}
                          onChange={(e) => updateCurrentTransform({ scale: parseFloat(e.target.value) })}
                          className="w-full accent-white"
                        />
                        <button
                          type="button"
                          onClick={() => updateCurrentTransform({ scale: Math.min(3.0, currentTransform.scale + 0.1) })}
                          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-white flex items-center justify-center text-sm font-bold shrink-0"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Pan Horizontal & Vertical Sliders */}
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
                          <Move className="w-3.5 h-3.5" />
                          <span>Pan Position (X & Y)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateCurrentTransform({ offsetX: 0, offsetY: 0 })}
                          className="text-[11px] font-semibold text-white/70 hover:text-white"
                        >
                          Center (0,0)
                        </button>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                            <span>Horizontal (Left / Right)</span>
                            <span className="font-mono text-white">{currentTransform.offsetX}%</span>
                          </div>
                          <input
                            type="range"
                            min={-60}
                            max={60}
                            step={1}
                            value={currentTransform.offsetX}
                            onChange={(e) => updateCurrentTransform({ offsetX: parseInt(e.target.value, 10) })}
                            className="w-full accent-white"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                            <span>Vertical (Up / Down)</span>
                            <span className="font-mono text-white">{currentTransform.offsetY}%</span>
                          </div>
                          <input
                            type="range"
                            min={-60}
                            max={60}
                            step={1}
                            value={currentTransform.offsetY}
                            onChange={(e) => updateCurrentTransform({ offsetY: parseInt(e.target.value, 10) })}
                            className="w-full accent-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Rotation, Straighten & 90° Turn */}
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-semibold text-neutral-300">
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>Rotation & Angle</span>
                        </div>
                        <span className="font-mono text-white font-bold">
                          {currentTransform.rotation}°
                        </span>
                      </div>

                      {/* Quick 90°, 180°, 270° and Straighten buttons */}
                      <div className="grid grid-cols-4 gap-2">
                        <button
                          type="button"
                          onClick={() => updateCurrentTransform({ rotation: ((currentTransform.rotation - 90 + 360) % 360) - (currentTransform.rotation - 90 >= 180 ? 360 : 0) })}
                          className="btn-press p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex flex-col items-center justify-center gap-1 border border-white/10"
                          title="Rotate 90 degrees counter-clockwise"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>-90°</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => updateCurrentTransform({ rotation: ((currentTransform.rotation + 90) % 360) > 180 ? ((currentTransform.rotation + 90) % 360) - 360 : (currentTransform.rotation + 90) % 360 })}
                          className="btn-press p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex flex-col items-center justify-center gap-1 border border-white/10"
                          title="Rotate 90 degrees clockwise"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>+90°</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => updateCurrentTransform({ rotation: ((currentTransform.rotation + 180) % 360) > 180 ? ((currentTransform.rotation + 180) % 360) - 360 : (currentTransform.rotation + 180) % 360 })}
                          className="btn-press p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex flex-col items-center justify-center gap-1 border border-white/10"
                          title="Rotate 180 degrees (upside down)"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>180°</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => updateCurrentTransform({ rotation: ((currentTransform.rotation + 270) % 360) > 180 ? ((currentTransform.rotation + 270) % 360) - 360 : (currentTransform.rotation + 270) % 360 })}
                          className="btn-press p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex flex-col items-center justify-center gap-1 border border-white/10"
                          title="Rotate 270 degrees"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>270°</span>
                        </button>
                      </div>

                      {/* Free Angle Slider */}
                      <div>
                        <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                          <span>Free Angle (-180° to +180°)</span>
                          <button
                            type="button"
                            onClick={() => updateCurrentTransform({ rotation: 0 })}
                            className="text-white/70 hover:text-white"
                          >
                            Reset 0°
                          </button>
                        </div>
                        <input
                          type="range"
                          min={-180}
                          max={180}
                          step={1}
                          value={currentTransform.rotation}
                          onChange={(e) => updateCurrentTransform({ rotation: parseInt(e.target.value, 10) })}
                          className="w-full accent-white"
                        />
                      </div>
                    </div>

                    {/* Flip Controls */}
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                      <span className="text-xs font-semibold text-neutral-300 block">Flip & Mirror</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => updateCurrentTransform({ flipX: !currentTransform.flipX })}
                          className={`btn-press p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                            currentTransform.flipX
                              ? 'bg-white text-black border-white shadow-md'
                              : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                          }`}
                        >
                          <FlipHorizontal className="w-3.5 h-3.5" />
                          <span>Flip Horizontal</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => updateCurrentTransform({ flipY: !currentTransform.flipY })}
                          className={`btn-press p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                            currentTransform.flipY
                              ? 'bg-white text-black border-white shadow-md'
                              : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                          }`}
                        >
                          <FlipVertical className="w-3.5 h-3.5" />
                          <span>Flip Vertical</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 3: FRAME SHAPES */}
            {activeTab === 'frame' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Frame Shape</h3>
                  <p className="text-xs text-neutral-400">
                    Select a shape for your widget on the Android launcher.
                  </p>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {Object.values(SHAPE_DEFINITIONS).map((shape) => {
                    const isSelected = frameShape === shape.id;
                    return (
                      <button
                        key={shape.id}
                        onClick={() => setFrameShape(shape.id)}
                        className={`card-press p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2.5 transition-all ${
                          isSelected
                            ? 'bg-white/10 border-white shadow-md ring-1 ring-white/30'
                            : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/15'
                        }`}
                      >
                        <div className="w-12 h-12 flex items-center justify-center">
                          <svg className="w-10 h-10" viewBox="0 0 100 100">
                            <path
                              d={shape.iconPath}
                              fill={isSelected ? '#ffffff' : '#64748b'}
                              className="transition-colors duration-200"
                            />
                          </svg>
                        </div>
                        <span
                          className={`text-xs font-semibold capitalize truncate max-w-full ${
                            isSelected ? 'text-white' : 'text-neutral-400'
                          }`}
                        >
                          {shape.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: BORDERS & GLOW */}
            {activeTab === 'border' && (
              <div className="space-y-6 max-w-xl">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Border Framing & Glass Glow</h3>
                  <p className="text-xs text-neutral-400">
                    Adjust border stroke width, color tones, brightness, and smooth glass glow reflections.
                  </p>
                </div>

                <div
                  onClick={() => setBorderEnabled(!borderEnabled)}
                  className="card-press flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/10 cursor-pointer hover:bg-white/[0.05] transition-colors"
                >
                  <div>
                    <span className="text-xs font-semibold text-white block">Enable Frame Border</span>
                    <span className="text-[11px] text-neutral-400">Show visible stroke following the exact widget shape</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={borderEnabled}
                    onChange={(e) => {
                      e.stopPropagation();
                      setBorderEnabled(e.target.checked);
                    }}
                    className="w-5 h-5 accent-white cursor-pointer"
                  />
                </div>

                {borderEnabled && (
                  <>
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-300">Stroke Thickness</span>
                        <span className="font-mono text-white font-bold">{borderWidth}px</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={16}
                        step={1}
                        value={borderWidth}
                        onChange={(e) => setBorderWidth(Number(e.target.value))}
                        className="w-full accent-white cursor-pointer"
                      />
                    </div>

                    <div
                      onClick={() => setBorderGlow(!borderGlow)}
                      className="card-press flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/10 cursor-pointer hover:bg-white/[0.05] transition-colors"
                    >
                      <div>
                        <span className="text-xs font-semibold text-white block">Glass Glow Backlight</span>
                        <span className="text-[11px] text-neutral-400">Subtle luminous reflection following frame shape</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={borderGlow}
                        onChange={(e) => {
                          e.stopPropagation();
                          setBorderGlow(e.target.checked);
                        }}
                        className="w-5 h-5 accent-white cursor-pointer"
                      />
                    </div>

                    {borderGlow && (
                      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-neutral-300">Glow Intensity & Brightness</span>
                          <span className="font-mono text-white font-bold">{glowIntensity}%</span>
                        </div>
                        <input
                          type="range"
                          min={10}
                          max={100}
                          step={5}
                          value={glowIntensity}
                          onChange={(e) => setGlowIntensity(Number(e.target.value))}
                          className="w-full accent-white cursor-pointer"
                        />
                        <div className="grid grid-cols-4 gap-2 pt-1">
                          {[
                            { label: 'Subtle', val: 25 },
                            { label: 'Soft Glass', val: 50 },
                            { label: 'Luminous', val: 75 },
                            { label: 'Vibrant', val: 100 },
                          ].map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => {
                                setGlowIntensity(preset.val);
                              }}
                              className={`btn-press py-1.5 px-2 rounded-xl text-[10px] font-semibold border transition-all ${
                                glowIntensity === preset.val
                                  ? 'bg-white text-black border-white shadow-sm'
                                  : 'bg-white/[0.04] text-neutral-300 border-white/10 hover:bg-white/[0.08]'
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-300 block">Border Tone</span>
                        <button
                          type="button"
                          onClick={() => {
                            setBorderColor('#ffffff');
                            setGlowIntensity(40);
                            setBorderGlow(true);
                          }}
                          className="btn-press text-[10px] text-white/80 hover:text-white px-2 py-0.5 rounded-full bg-white/10 border border-white/15"
                        >
                          Clean White Glass Glow
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        {PRESET_BORDER_COLORS.map((col, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setBorderColor(col)}
                            className={`btn-press w-10 h-10 min-w-[40px] min-h-[40px] rounded-full border-2 transition-transform ${
                              borderColor === col ? 'scale-110 border-white shadow-md ring-2 ring-white/40' : 'border-white/20'
                            }`}
                            style={{ backgroundColor: col }}
                          />
                        ))}
                        <div className="flex items-center gap-2 ml-2">
                          <input
                            type="color"
                            value={borderColor.startsWith('#') ? borderColor : '#ffffff'}
                            onChange={(e) => setBorderColor(e.target.value)}
                            className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                          />
                          <span className="text-xs font-mono text-neutral-400">{borderColor}</span>
                        </div>
                      </div>
                    </div>

                    {/* Show Title on Home Screen toggle */}
                    <div
                      onClick={() => setShowTitleOnHome(!showTitleOnHome)}
                      className="card-press flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/10 cursor-pointer hover:bg-white/[0.05] transition-colors"
                    >
                      <div>
                        <span className="text-xs font-semibold text-white block">Overlay Custom Name Badge</span>
                        <span className="text-[11px] text-neutral-400">
                          Show frosted title badge with "{name || 'Glass Widget'}" directly on widget
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={showTitleOnHome}
                        onChange={(e) => {
                          e.stopPropagation();
                          setShowTitleOnHome(e.target.checked);
                        }}
                        className="w-5 h-5 accent-white cursor-pointer"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 5: FILTERS */}
            {activeTab === 'filters' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Color Filters</h3>
                  <p className="text-xs text-neutral-400">
                    Apply photographic grading filters to your images.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {Object.values(FILTER_DEFINITIONS).map((f) => {
                    const isSelected = filterTone === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setFilterTone(f.id)}
                        className={`card-press p-3.5 rounded-2xl border flex flex-col items-center gap-2.5 transition-all ${
                          isSelected
                            ? 'bg-white/10 border-white shadow-md ring-1 ring-white/20'
                            : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-xl shadow-inner border border-white/10"
                          style={{ backgroundColor: f.previewColor }}
                        />
                        <span
                          className={`text-xs font-semibold ${
                            isSelected ? 'text-white' : 'text-neutral-400'
                          }`}
                        >
                          {f.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {filterTone !== 'original' && (
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-300">Filter Strength</span>
                      <span className="font-mono text-white font-bold">{filterIntensity}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={filterIntensity}
                      onChange={(e) => setFilterIntensity(Number(e.target.value))}
                      className="w-full accent-white"
                    />
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: TEXTURES */}
            {activeTab === 'textures' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Atmospheric Textures</h3>
                  <p className="text-xs text-neutral-400">
                    Add subtle surface textures like 35mm film grain, fine paper, or soft bloom.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.values(TEXTURE_DEFINITIONS).map((tex) => {
                    const isSelected = textureType === tex.id;
                    return (
                      <button
                        key={tex.id}
                        onClick={() => setTextureType(tex.id)}
                        className={`card-press p-3.5 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-white/10 border-white shadow-md ring-1 ring-white/20'
                            : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                        }`}
                      >
                        <span
                          className={`text-xs font-bold block ${
                            isSelected ? 'text-white' : 'text-neutral-200'
                          }`}
                        >
                          {tex.label}
                        </span>
                        <span className="text-[10px] text-neutral-400 leading-tight mt-1 block">
                          {tex.description}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {textureType !== 'none' && (
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-300">Texture Opacity</span>
                      <span className="font-mono text-white font-bold">{textureIntensity}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={textureIntensity}
                      onChange={(e) => setTextureIntensity(Number(e.target.value))}
                      className="w-full accent-white"
                    />
                  </div>
                )}
              </div>
            )}

            {/* TAB 7: SCHEDULE */}
            {activeTab === 'schedule' && (
              <div className="space-y-6 max-w-xl">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">Rotation Scheduling</h3>
                  <p className="text-xs text-neutral-400">
                    Configure automated photo cycling intervals for your Android home screen.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                  <span className="text-xs font-semibold text-neutral-300 block">Rotation Interval</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'off', label: 'Manual (Tap)' },
                      { id: '15m', label: 'Every 15m' },
                      { id: '30m', label: 'Every 30m' },
                      { id: '1h', label: 'Hourly' },
                      { id: '3h', label: 'Every 3h' },
                      { id: '6h', label: 'Every 6h' },
                      { id: '12h', label: 'Every 12h' },
                      { id: '24h', label: 'Daily (24h)' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setRotationInterval(opt.id as RotationInterval)}
                        className={`btn-press p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          rotationInterval === opt.id
                            ? 'bg-white text-black border-white shadow-sm'
                            : 'bg-white/5 text-neutral-400 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                  <span className="text-xs font-semibold text-neutral-300 block">Rotation Sequence</span>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'sequential', label: 'Sequential', desc: '1 → 2 → 3 → 4' },
                      { id: 'random', label: 'Random Shuffle', desc: 'Surprise photo each rotation' },
                    ].map((ord) => (
                      <button
                        key={ord.id}
                        onClick={() => setRotationOrder(ord.id as RotationOrder)}
                        className={`card-press p-3 rounded-xl border text-left transition-all ${
                          rotationOrder === ord.id
                            ? 'bg-white text-black border-white shadow-sm'
                            : 'bg-white/5 text-neutral-400 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-xs font-bold block">{ord.label}</span>
                        <span className="text-[10px] opacity-70 mt-0.5 block">{ord.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Saved Photos Selection Modal */}
      <AnimatePresence>
        {showSavedPhotosModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="w-full max-w-md rounded-3xl bg-neutral-950 border border-white/15 p-5 shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-sm font-bold text-white">Select from Existing Photos</h3>
                <button
                  type="button"
                  onClick={() => setShowSavedPhotosModal(false)}
                  className="icon-btn-press w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 grid grid-cols-2 gap-3">
                {existingSavedPhotos.map((sp) => (
                  <div
                    key={sp.url}
                    onClick={() => {
                      handleAddSavedPhoto(sp);
                      setShowSavedPhotosModal(false);
                    }}
                    className="group relative rounded-2xl overflow-hidden border border-white/10 aspect-square cursor-pointer hover:border-white/40 transition-colors"
                  >
                    <img
                      src={sp.url}
                      alt={sp.name || 'Saved'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                      <span className="text-[10px] font-semibold text-white truncate w-full">
                        {sp.name || 'Photo'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {editorToast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-neutral-900 border border-white/20 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 pointer-events-none"
          >
            <Check className="w-3.5 h-3.5 text-white" />
            <span>{editorToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
