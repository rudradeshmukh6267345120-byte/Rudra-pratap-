import React, { useId } from 'react';
import { WidgetConfig, DEFAULT_PHOTO_TRANSFORM } from '../types/widget';
import { SHAPE_DEFINITIONS } from '../utils/shapes';
import { FILTER_DEFINITIONS, TEXTURE_DEFINITIONS, getMoodToneForTime } from '../utils/filters';
import { motion, AnimatePresence } from 'motion/react';
import { ImageOff } from 'lucide-react';

interface WidgetPreviewProps {
  widget: WidgetConfig;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'responsive';
  interactive?: boolean;
  onCyclePhoto?: () => void;
  showCaption?: boolean;
  highlightBorder?: boolean;
  showCropGrid?: boolean;
}

export const WidgetPreview: React.FC<WidgetPreviewProps> = ({
  widget,
  className = '',
  size = 'responsive',
  interactive = true,
  onCyclePhoto,
  showCaption = false,
  showCropGrid = false,
}) => {
  const shapeDef = SHAPE_DEFINITIONS[widget.frameShape] || SHAPE_DEFINITIONS.rounded_square;
  const currentPhoto = widget.photos[widget.activePhotoIndex] || widget.photos[0];
  const transform = currentPhoto?.transform || DEFAULT_PHOTO_TRANSFORM;
  const layout = widget.layout || 'single';
  const spacing = widget.layoutSpacing !== undefined ? widget.layoutSpacing : 2;

  // Unique clip-path ID for SVG objectBoundingBox
  const baseId = useId().replace(/:/g, '');
  const clipId = `glass-clip-${baseId}-${widget.id || 'w'}-${widget.frameShape}`;

  let activeTone = widget.filter.tone;
  if (widget.schedule?.moodRotation) {
    activeTone = getMoodToneForTime().tone;
  }
  const filterDef = FILTER_DEFINITIONS[activeTone] || FILTER_DEFINITIONS.original;
  const textureDef = TEXTURE_DEFINITIONS[widget.texture.type] || TEXTURE_DEFINITIONS.none;
  const cssFilter = filterDef.getCssFilter(widget.filter.intensity);
  const textureStyle = textureDef.getOverlayStyle(widget.texture.intensity);

  // Border & Glow calculations
  const hasBorder = widget.border.enabled && widget.border.width > 0;
  const borderWidth = `${widget.border.width}px`;
  const borderColor = widget.border.color || '#ffffff';
  const glowIntensity = widget.border.glowIntensity !== undefined ? widget.border.glowIntensity : 60;
  const hasGlow = hasBorder && Boolean(widget.border.glow) && glowIntensity > 0;

  // Compute subtle, clean glow without harsh white edges or rectangular halos
  const glowRadius = Math.max(2, (glowIntensity / 100) * (widget.border.width * 2.8 + 4));
  const glowAlpha = Math.min(0.65, (glowIntensity / 100) * 0.7);

  // Convert hex color to rgba for clean glass glow
  const getRgba = (colorHex: string, alpha: number) => {
    if (colorHex.startsWith('#') && (colorHex.length === 7 || colorHex.length === 4)) {
      const hex = colorHex.length === 4
        ? `#${colorHex[1]}${colorHex[1]}${colorHex[2]}${colorHex[2]}${colorHex[3]}${colorHex[3]}`
        : colorHex;
      const r = parseInt(hex.slice(1, 3), 16) || 255;
      const g = parseInt(hex.slice(3, 5), 16) || 255;
      const b = parseInt(hex.slice(5, 7), 16) || 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
    }
    return colorHex;
  };

  const glowColorStr = getRgba(borderColor, glowAlpha);
  const innerGlowColorStr = getRgba(borderColor, Math.min(0.4, glowAlpha * 0.6));

  const sizeClasses = {
    xs: 'w-16 h-16',
    sm: 'w-24 h-24',
    md: 'w-48 h-48',
    lg: 'w-64 h-64 sm:w-72 sm:h-72',
    responsive: 'w-full aspect-square max-w-[280px]',
  }[size];

  const [imageError, setImageError] = React.useState(false);
  React.useEffect(() => {
    setImageError(false);
  }, [currentPhoto?.url]);

  // Determine whether to use SVG clipPath vs CSS border-radius
  const hasSvgClip = Boolean(shapeDef.normalizedPath);

  // Render individual photo with transform & filters
  const renderPhotoImage = (photoUrl: string, altName: string, isMain: boolean = true) => {
    const photoTransform = isMain ? transform : DEFAULT_PHOTO_TRANSFORM;
    const fitting = photoTransform.fitting || 'fill';

    return (
      <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
        <img
          src={photoUrl}
          alt={altName}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className="w-full h-full select-none pointer-events-none transition-transform duration-100 ease-out"
          style={{
            filter: cssFilter,
            objectFit: fitting === 'fit' ? 'contain' : 'cover',
            transform: `translate(${photoTransform.offsetX}%, ${photoTransform.offsetY}%) scale(${photoTransform.scale}) rotate(${photoTransform.rotation}deg) scaleX(${photoTransform.flipX ? -1 : 1}) scaleY(${photoTransform.flipY ? -1 : 1})`,
            transformOrigin: 'center center',
          }}
        />
      </div>
    );
  };

  // Render multi-photo layouts
  const renderLayoutContent = () => {
    const photos = widget.photos;
    if (photos.length <= 1 || layout === 'single') {
      return renderPhotoImage(currentPhoto.url, widget.name, true);
    }

    const gapStyle = { gap: `${spacing}px` };

    switch (layout) {
      case 'row_1x2':
        return (
          <div className="w-full h-full grid grid-cols-2 bg-black" style={gapStyle}>
            {photos.slice(0, 2).map((p, idx) => (
              <div key={p.id + idx} className="w-full h-full overflow-hidden">
                {renderPhotoImage(p.url, p.name || `Photo ${idx + 1}`, idx === widget.activePhotoIndex)}
              </div>
            ))}
          </div>
        );

      case 'col_2x1':
        return (
          <div className="w-full h-full grid grid-rows-2 bg-black" style={gapStyle}>
            {photos.slice(0, 2).map((p, idx) => (
              <div key={p.id + idx} className="w-full h-full overflow-hidden">
                {renderPhotoImage(p.url, p.name || `Photo ${idx + 1}`, idx === widget.activePhotoIndex)}
              </div>
            ))}
          </div>
        );

      case 'tri_photo':
        // 1 large photo on left (60%), 2 smaller stacked on right (40%)
        return (
          <div className="w-full h-full grid grid-cols-5 bg-black" style={gapStyle}>
            <div className="col-span-3 w-full h-full overflow-hidden">
              {renderPhotoImage(photos[0].url, photos[0].name || 'Photo 1', 0 === widget.activePhotoIndex)}
            </div>
            <div className="col-span-2 w-full h-full grid grid-rows-2" style={gapStyle}>
              {photos.slice(1, 3).map((p, idx) => (
                <div key={p.id + idx} className="w-full h-full overflow-hidden">
                  {renderPhotoImage(p.url, p.name || `Photo ${idx + 2}`, idx + 1 === widget.activePhotoIndex)}
                </div>
              ))}
            </div>
          </div>
        );

      case 'grid_2x2':
        return (
          <div className="w-full h-full grid grid-cols-2 grid-rows-2 bg-black" style={gapStyle}>
            {photos.slice(0, 4).map((p, idx) => (
              <div key={p.id + idx} className="w-full h-full overflow-hidden">
                {renderPhotoImage(p.url, p.name || `Photo ${idx + 1}`, idx === widget.activePhotoIndex)}
              </div>
            ))}
          </div>
        );

      case 'strip_h':
        // 3 or 4 photos in horizontal row
        return (
          <div
            className="w-full h-full grid bg-black"
            style={{
              gridTemplateColumns: `repeat(${Math.min(photos.length, 4)}, minmax(0, 1fr))`,
              ...gapStyle,
            }}
          >
            {photos.slice(0, 4).map((p, idx) => (
              <div key={p.id + idx} className="w-full h-full overflow-hidden">
                {renderPhotoImage(p.url, p.name || `Photo ${idx + 1}`, idx === widget.activePhotoIndex)}
              </div>
            ))}
          </div>
        );

      case 'strip_v':
        // 3 or 4 photos in vertical column
        return (
          <div
            className="w-full h-full grid bg-black"
            style={{
              gridTemplateRows: `repeat(${Math.min(photos.length, 4)}, minmax(0, 1fr))`,
              ...gapStyle,
            }}
          >
            {photos.slice(0, 4).map((p, idx) => (
              <div key={p.id + idx} className="w-full h-full overflow-hidden">
                {renderPhotoImage(p.url, p.name || `Photo ${idx + 1}`, idx === widget.activePhotoIndex)}
              </div>
            ))}
          </div>
        );

      case 'tiles_multi':
        // 6 small square tiles (3 cols x 2 rows)
        return (
          <div className="w-full h-full grid grid-cols-3 grid-rows-2 bg-black" style={gapStyle}>
            {photos.slice(0, 6).map((p, idx) => (
              <div key={p.id + idx} className="w-full h-full overflow-hidden">
                {renderPhotoImage(p.url, p.name || `Photo ${idx + 1}`, idx === widget.activePhotoIndex)}
              </div>
            ))}
          </div>
        );

      default:
        return renderPhotoImage(currentPhoto.url, widget.name, true);
    }
  };

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* SVG Definitions for Object-Bounding-Box Clipping Paths */}
      {hasSvgClip && shapeDef.normalizedPath && (
        <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
          <defs>
            <clipPath id={clipId} clipPathUnits="objectBoundingBox">
              <path d={shapeDef.normalizedPath} />
            </clipPath>
          </defs>
        </svg>
      )}

      {/* Main Widget Container */}
      {/* Outer element has EXACT shape border-radius or clipPath - NEVER cast square shadows */}
      <motion.div
        whileTap={interactive ? { scale: 0.96 } : undefined}
        onClick={interactive ? onCyclePhoto : undefined}
        className={`relative ${sizeClasses} cursor-pointer group transition-all duration-300 gpu-60fps`}
        style={{
          borderRadius: !hasSvgClip ? shapeDef.cssBorderRadius : undefined,
          boxShadow: !hasSvgClip && hasGlow
            ? `0 0 ${glowRadius * 2}px ${glowColorStr}, inset 0 0 ${glowRadius}px ${innerGlowColorStr}`
            : undefined,
        }}
      >
        {/* Clipped Inner Container: Contains Photos, Filters, Sheen */}
        <div
          className="w-full h-full relative overflow-hidden bg-black"
          style={{
            borderRadius: !hasSvgClip ? shapeDef.cssBorderRadius : undefined,
            clipPath: hasSvgClip ? `url(#${clipId})` : shapeDef.cssClipPath,
          }}
        >
          {/* Main Photo Content or Layout */}
          <AnimatePresence mode="wait">
            {currentPhoto ? (
              <motion.div
                key={currentPhoto.id + widget.activePhotoIndex + layout}
                initial={{ opacity: 0.7, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0.5, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full relative gpu-60fps"
              >
                {!imageError ? (
                  renderLayoutContent()
                ) : (
                  <div className="w-full h-full bg-[#0a0a0a] flex flex-col items-center justify-center p-3 text-center text-slate-300">
                    <ImageOff className="w-8 h-8 mb-1.5 text-slate-400 opacity-60" />
                    <span className="text-[10px] text-slate-400 font-medium">Photo unavailable</span>
                  </div>
                )}
              </motion.div>
            ) : (
              /* Authentic Glass Widgets Logo Centered on OLED Black */
              <div className="w-full h-full bg-[#000000] flex flex-col items-center justify-center p-5 text-center select-none relative">
                <div className="w-3/5 h-3/5 relative flex items-center justify-center">
                  <img
                    src="/logo.png"
                    alt="Glass Widgets"
                    className="w-full h-full object-contain pointer-events-none drop-shadow-[0_4px_12px_rgba(255,255,255,0.15)]"
                  />
                </div>
                {size !== 'xs' && size !== 'sm' && (
                  <span className="text-[11px] font-bold text-white/70 mt-2 tracking-wide uppercase">
                    Glass Widgets
                  </span>
                )}
              </div>
            )}
          </AnimatePresence>

          {/* Atmospheric Texture Overlay */}
          {widget.texture.type !== 'none' && (
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                mixBlendMode: textureDef.blendMode,
                ...textureStyle,
              }}
            />
          )}

          {/* Rule of Thirds Crop Grid Guide Overlay (when adjusting photo crop) */}
          {showCropGrid && (
            <div className="absolute inset-0 pointer-events-none z-15 grid grid-cols-3 grid-rows-3 opacity-40">
              <div className="border-r border-b border-white/40" />
              <div className="border-r border-b border-white/40" />
              <div className="border-b border-white/40" />
              <div className="border-r border-b border-white/40" />
              <div className="border-r border-b border-white/40" />
              <div className="border-b border-white/40" />
              <div className="border-r border-white/40" />
              <div className="border-r border-white/40" />
              <div />
            </div>
          )}

          {/* 3D Glass Specular Reflection Highlight */}
          <div className="absolute inset-0 pointer-events-none z-15 bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.18]" />

          {/* Optional Title Badge Overlay on Home screen if enabled */}
          {widget.showTitleOnHome && widget.name && (
            <div className="absolute bottom-2 left-2 right-2 z-20 flex justify-center pointer-events-none">
              <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-semibold text-white/95 border border-white/20 shadow-sm truncate max-w-[90%]">
                {widget.name}
              </span>
            </div>
          )}

          {/* Bottom Photo Rotation Indicators */}
          {widget.photos.length > 1 && layout === 'single' && !widget.showTitleOnHome && (
            <div className="absolute bottom-2.5 left-0 right-0 flex items-center justify-center gap-1.5 z-20 pointer-events-none">
              {widget.photos.map((_, idx) => (
                <span
                  key={idx}
                  className={`transition-all duration-300 rounded-full ${
                    idx === widget.activePhotoIndex
                      ? 'w-3.5 h-1 bg-white shadow-sm'
                      : 'w-1 h-1 bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* CSS Border Layer (for border-radius shapes like circle, squircle, square, card, arch, oval) */}
        {hasBorder && !hasSvgClip && !shapeDef.cssClipPath && (
          <div
            className="absolute inset-0 pointer-events-none z-20"
            style={{
              borderRadius: shapeDef.cssBorderRadius,
              border: `${borderWidth} solid ${borderColor}`,
            }}
          />
        )}

        {/* Vector SVG Border & Glow Layer (for Heart, Diamond, Star, Hexagon, Shield) */}
        {hasBorder && (hasSvgClip || shapeDef.cssClipPath) && (
          <div className="absolute inset-0 pointer-events-none z-20">
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ overflow: 'visible' }}
            >
              {/* Diffused soft glow strictly following the vector path */}
              {hasGlow && (
                <path
                  d={shapeDef.iconPath}
                  fill="none"
                  stroke={borderColor}
                  strokeWidth={widget.border.width + Math.min(glowIntensity * 0.08, 6)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={Math.min(glowIntensity / 100 * 0.7, 0.7)}
                  style={{
                    filter: `drop-shadow(0 0 ${(glowIntensity / 100) * 8}px ${glowColorStr})`,
                  }}
                />
              )}
              {/* Sharp, exact vector border outline */}
              <path
                d={shapeDef.iconPath}
                fill="none"
                stroke={borderColor}
                strokeWidth={widget.border.width}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </motion.div>

      {/* Optional Caption Badge */}
      {showCaption && (
        <div className="mt-3 text-center">
          <p className="text-sm font-semibold text-slate-200 tracking-tight truncate max-w-[180px]">
            {widget.name}
          </p>
          <p className="text-[11px] text-slate-400">
            {shapeDef.label} {widget.photos.length > 1 ? `· ${widget.photos.length} photos` : ''}
          </p>
        </div>
      )}
    </div>
  );
};
