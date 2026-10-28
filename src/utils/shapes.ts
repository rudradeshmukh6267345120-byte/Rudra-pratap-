import { FrameShape } from '../types/widget';

export interface ShapeDefinition {
  id: FrameShape;
  label: string;
  cssBorderRadius?: string;
  cssClipPath?: string;
  normalizedPath?: string; // 0..1 coordinates for clipPathUnits="objectBoundingBox"
  iconPath: string; // 0..100 coordinates for SVG viewBox="0 0 100 100"
}

export const SHAPE_DEFINITIONS: Record<FrameShape, ShapeDefinition> = {
  rounded_square: {
    id: 'rounded_square',
    label: 'Rounded Square',
    cssBorderRadius: '26%',
    iconPath: 'M 18,6 C 11,6 6,11 6,18 L 6,82 C 6,89 11,94 18,94 L 82,94 C 89,94 94,89 94,82 L 94,18 C 94,11 89,6 82,6 Z',
  },
  circle: {
    id: 'circle',
    label: 'Circle',
    cssBorderRadius: '50%',
    iconPath: 'M 50,6 A 44,44 0 1,0 50,94 A 44,44 0 1,0 50,6 Z',
  },
  squircle: {
    id: 'squircle',
    label: 'Squircle',
    cssBorderRadius: '36%',
    iconPath: 'M 50,6 C 85,6 94,15 94,50 C 94,85 85,94 50,94 C 15,94 6,85 6,50 C 6,15 15,6 50,6 Z',
  },
  square: {
    id: 'square',
    label: 'Square',
    cssBorderRadius: '12px',
    iconPath: 'M 12,6 L 88,6 C 92,6 94,8 94,12 L 94,88 C 94,92 92,94 88,94 L 12,94 C 8,94 6,92 6,88 L 6,12 C 6,8 8,6 12,6 Z',
  },
  rectangle: {
    id: 'rectangle',
    label: 'Smooth Card',
    cssBorderRadius: '22px',
    iconPath: 'M 22,6 L 78,6 C 87,6 94,13 94,22 L 94,78 C 94,87 87,94 78,94 L 22,94 C 13,94 6,87 6,78 L 6,22 C 6,13 13,6 22,6 Z',
  },
  diamond: {
    id: 'diamond',
    label: 'Diamond',
    cssClipPath: 'polygon(50% 4%, 96% 50%, 50% 96%, 4% 50%)',
    normalizedPath: 'M 0.5,0.04 L 0.96,0.5 L 0.5,0.96 L 0.04,0.5 Z',
    iconPath: 'M 50,4 L 96,50 L 50,96 L 4,50 Z',
  },
  hexagon: {
    id: 'hexagon',
    label: 'Hexagon',
    cssClipPath: 'polygon(50% 4%, 94% 26%, 94% 74%, 50% 96%, 6% 74%, 6% 26%)',
    normalizedPath: 'M 0.5,0.04 L 0.94,0.26 L 0.94,0.74 L 0.5,0.96 L 0.06,0.74 L 0.06,0.26 Z',
    iconPath: 'M 50,4 L 94,26 L 94,74 L 50,96 L 6,74 L 6,26 Z',
  },
  heart: {
    id: 'heart',
    label: 'Heart',
    normalizedPath: 'M 0.5,0.26 C 0.5,0.26 0.40,0.08 0.24,0.08 C 0.12,0.08 0.05,0.18 0.05,0.32 C 0.05,0.52 0.26,0.70 0.5,0.92 C 0.74,0.70 0.95,0.52 0.95,0.32 C 0.95,0.18 0.88,0.08 0.76,0.08 C 0.60,0.08 0.5,0.26 0.5,0.26 Z',
    iconPath: 'M 50,26 C 50,26 40,8 24,8 C 12,8 5,18 5,32 C 5,52 26,70 50,92 C 74,70 95,52 95,32 C 95,18 88,8 76,8 C 60,8 50,26 50,26 Z',
  },
  star: {
    id: 'star',
    label: 'Star',
    cssClipPath: 'polygon(50% 5%, 63% 36%, 97% 38%, 70% 58%, 80% 92%, 50% 72%, 20% 92%, 30% 58%, 3% 38%, 37% 36%)',
    normalizedPath: 'M 0.5,0.05 L 0.63,0.36 L 0.97,0.38 L 0.70,0.58 L 0.80,0.92 L 0.5,0.72 L 0.20,0.92 L 0.30,0.58 L 0.03,0.38 L 0.37,0.36 Z',
    iconPath: 'M 50,5 L 63,36 L 97,38 L 70,58 L 80,92 L 50,72 L 20,92 L 30,58 L 3,38 L 37,36 Z',
  },
  arch: {
    id: 'arch',
    label: 'Arch',
    cssBorderRadius: '50% 50% 16px 16px / 45% 45% 16px 16px',
    iconPath: 'M 50,6 C 26,6 8,24 8,48 L 8,86 C 8,90 12,94 16,94 L 84,94 C 88,94 92,90 92,86 L 92,48 C 92,24 74,6 50,6 Z',
  },
  oval: {
    id: 'oval',
    label: 'Oval',
    cssBorderRadius: '50% / 36%',
    iconPath: 'M 50,14 C 74,14 94,30 94,50 C 94,70 74,86 50,86 C 26,86 6,70 6,50 C 6,30 26,14 50,14 Z',
  },
  shield: {
    id: 'shield',
    label: 'Shield',
    cssClipPath: 'polygon(50% 4%, 94% 14%, 94% 56%, 50% 96%, 6% 56%, 6% 14%)',
    normalizedPath: 'M 0.5,0.04 L 0.94,0.14 L 0.94,0.56 C 0.94,0.78 0.72,0.90 0.5,0.96 C 0.28,0.90 0.06,0.78 0.06,0.56 L 0.06,0.14 Z',
    iconPath: 'M 50,4 L 94,14 L 94,56 C 94,78 72,90 50,96 C 28,90 6,78 6,56 L 6,14 Z',
  },
};
