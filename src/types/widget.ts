export type FrameShape =
  | 'rounded_square'
  | 'circle'
  | 'squircle'
  | 'square'
  | 'rectangle'
  | 'diamond'
  | 'hexagon'
  | 'heart'
  | 'star'
  | 'arch'
  | 'oval'
  | 'shield';

export type FilterTone =
  | 'original'
  | 'mono'
  | 'vivid'
  | 'warm'
  | 'cool'
  | 'vintage'
  | 'grayscale'
  | 'cyberpunk'
  | 'sunset';

export type TextureType =
  | 'none'
  | 'grain'
  | 'paper'
  | 'film'
  | 'matte'
  | 'soft_glow'
  | 'frost'
  | 'prism'
  | 'vignette';

export type RotationInterval =
  | 'off'
  | '15m'
  | '30m'
  | '1h'
  | '3h'
  | '6h'
  | '12h'
  | '24h';

export type RotationOrder = 'sequential' | 'random';

export type PhotoLayout =
  | 'single'
  | 'row_1x2'
  | 'col_2x1'
  | 'tri_photo'
  | 'grid_2x2'
  | 'strip_h'
  | 'strip_v'
  | 'tiles_multi';

export interface PhotoTransform {
  offsetX: number; // pan horizontal percentage -50 to 50
  offsetY: number; // pan vertical percentage -50 to 50
  scale: number; // zoom 0.5 to 3.0
  rotation: number; // degrees -180 to 180
  flipX: boolean; // horizontal flip
  flipY: boolean; // vertical flip
  fitting: 'fill' | 'fit'; // fill (cover) or fit (contain)
}

export const DEFAULT_PHOTO_TRANSFORM: PhotoTransform = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  rotation: 0,
  flipX: false,
  flipY: false,
  fitting: 'fill',
};

export interface WidgetPhoto {
  id: string;
  url: string;
  name?: string;
  addedAt: number;
  transform?: PhotoTransform;
}

export interface WidgetBorder {
  enabled: boolean;
  color: string;
  width: number;
  glow?: boolean;
  glowIntensity?: number; // 0 to 100 percentage
}

export interface WidgetFilter {
  tone: FilterTone;
  intensity: number;
}

export interface WidgetTexture {
  type: TextureType;
  intensity: number;
}

export interface WidgetSchedule {
  interval: RotationInterval;
  order: RotationOrder;
  moodRotation: boolean;
  lastRotatedAt?: number;
}

export interface WidgetConfig {
  id: string;
  name: string;
  photos: WidgetPhoto[];
  activePhotoIndex: number;
  frameShape: FrameShape;
  border: WidgetBorder;
  filter: WidgetFilter;
  texture: WidgetTexture;
  schedule: WidgetSchedule;
  layout?: PhotoLayout;
  layoutSpacing?: number; // 0 to 8 px gap
  showTitleOnHome?: boolean;
  aspectRatio?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  defaultWidgetSize: string;
  photoFitting: string;
  defaultInterval: RotationInterval;
  autoMoodRotation: boolean;
  hapticFeedback: boolean;
}
