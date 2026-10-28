import { FilterTone, TextureType } from '../types/widget';

export interface FilterDefinition {
  id: FilterTone;
  label: string;
  previewColor: string;
  getCssFilter: (intensity: number) => string;
  colorMatrixAndroid?: number[];
}

export const FILTER_DEFINITIONS: Record<FilterTone, FilterDefinition> = {
  original: {
    id: 'original',
    label: 'Original',
    previewColor: '#38bdf8',
    getCssFilter: () => 'none',
  },
  mono: {
    id: 'mono',
    label: 'Mono',
    previewColor: '#94a3b8',
    getCssFilter: (intensity) => {
      const p = intensity / 100;
      return `grayscale(${p * 100}%) contrast(${100 + p * 15}%)`;
    },
  },
  vivid: {
    id: 'vivid',
    label: 'Vivid',
    previewColor: '#3b82f6',
    getCssFilter: (intensity) => {
      const p = intensity / 100;
      return `saturate(${100 + p * 60}%) contrast(${100 + p * 15}%) brightness(${100 + p * 5}%)`;
    },
  },
  warm: {
    id: 'warm',
    label: 'Warm',
    previewColor: '#f59e0b',
    getCssFilter: (intensity) => {
      const p = intensity / 100;
      return `sepia(${p * 35}%) saturate(${100 + p * 25}%) hue-rotate(${-10 * p}deg)`;
    },
  },
  cool: {
    id: 'cool',
    label: 'Cool',
    previewColor: '#06b6d4',
    getCssFilter: (intensity) => {
      const p = intensity / 100;
      return `hue-rotate(${25 * p}deg) saturate(${100 + p * 10}%) brightness(${100 + p * 4}%)`;
    },
  },
  vintage: {
    id: 'vintage',
    label: 'Vintage',
    previewColor: '#d97706',
    getCssFilter: (intensity) => {
      const p = intensity / 100;
      return `sepia(${p * 45}%) contrast(${100 - p * 10}%) saturate(${100 - p * 15}%) brightness(${100 + p * 6}%)`;
    },
  },
  grayscale: {
    id: 'grayscale',
    label: 'Grayscale',
    previewColor: '#64748b',
    getCssFilter: (intensity: number) => {
      const p = intensity / 100;
      return `grayscale(${p * 100}%)`;
    },
  },
  cyberpunk: {
    id: 'cyberpunk',
    label: 'Neon Cyan',
    previewColor: '#0ea5e9',
    getCssFilter: (intensity: number) => {
      const p = intensity / 100;
      return `hue-rotate(${170 * (intensity / 100)}deg) saturate(${100 + (intensity / 100) * 80}%) contrast(${100 + (intensity / 100) * 20}%)`;
    },
  },
  sunset: {
    id: 'sunset',
    label: 'Sunset',
    previewColor: '#f43f5e',
    getCssFilter: (intensity: number) => {
      const p = intensity / 100;
      return `hue-rotate(${340 * (intensity / 100)}deg) saturate(${100 + (intensity / 100) * 40}%) contrast(${100 + (intensity / 100) * 10}%)`;
    },
  },
};

export interface TextureDefinition {
  id: TextureType;
  label: string;
  description: string;
  blendMode: 'overlay' | 'multiply' | 'screen' | 'soft-light';
  getOverlayStyle: (intensity: number) => {
    opacity: number;
    backgroundImage?: string;
    backgroundColor?: string;
    filter?: string;
    boxShadow?: string;
  };
}

// Grain texture SVG pattern
const GRAIN_SVG = `data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='noiseFilter'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23noiseFilter)' opacity='0.7'/></svg>`;

// Paper texture SVG pattern
const PAPER_SVG = `data:image/svg+xml;utf8,<svg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'><filter id='paper'><feTurbulence type='turbulence' baseFrequency='0.04' numOctaves='5' result='noise'/></filter><rect width='100%' height='100%' filter='url(%23paper)'/></svg>`;

export const TEXTURE_DEFINITIONS: Record<TextureType, TextureDefinition> = {
  none: {
    id: 'none',
    label: 'None',
    description: 'Clean photograph without texture',
    blendMode: 'overlay',
    getOverlayStyle: () => ({ opacity: 0 }),
  },
  grain: {
    id: 'grain',
    label: 'Film Grain',
    description: 'Subtle 35mm analogue grain',
    blendMode: 'overlay',
    getOverlayStyle: (intensity: number) => ({
      opacity: (intensity / 100) * 0.45,
      backgroundImage: `url("${GRAIN_SVG}")`,
    }),
  },
  paper: {
    id: 'paper',
    label: 'Fine Paper',
    description: 'Textured archival art paper',
    blendMode: 'soft-light',
    getOverlayStyle: (intensity: number) => ({
      opacity: (intensity / 100) * 0.4,
      backgroundImage: `url("${PAPER_SVG}")`,
    }),
  },
  film: {
    id: 'film',
    label: 'Cinematic',
    description: 'Vignette border with subtle grain',
    blendMode: 'multiply',
    getOverlayStyle: (intensity: number) => ({
      opacity: (intensity / 100) * 0.65,
      backgroundImage: `radial-gradient(circle at center, transparent 40%, rgba(10, 15, 25, 0.75) 100%), url("${GRAIN_SVG}")`,
    }),
  },
  matte: {
    id: 'matte',
    label: 'Matte Frost',
    description: 'Soft frosted matte finish',
    blendMode: 'screen',
    getOverlayStyle: (intensity: number) => ({
      opacity: (intensity / 100) * 0.25,
      backgroundColor: '#ffffff',
      filter: 'blur(1px)',
    }),
  },
  soft_glow: {
    id: 'soft_glow',
    label: 'Soft Glow',
    description: 'Luminous ambient dream bloom',
    blendMode: 'screen',
    getOverlayStyle: (intensity: number) => ({
      opacity: (intensity / 100) * 0.45,
      backgroundImage: 'radial-gradient(circle at center, rgba(56, 189, 248, 0.45) 0%, rgba(14, 165, 233, 0.15) 50%, transparent 80%)',
    }),
  },
  frost: {
    id: 'frost',
    label: 'Frost Glass',
    description: 'Deep frosted ice glass dispersion',
    blendMode: 'screen',
    getOverlayStyle: (intensity: number) => ({
      opacity: (intensity / 100) * 0.35,
      backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4) 0%, transparent 70%)',
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    }),
  },
  prism: {
    id: 'prism',
    label: 'Prism Refraction',
    description: 'Chromatic glass refraction prism',
    blendMode: 'screen',
    getOverlayStyle: (intensity: number) => ({
      opacity: (intensity / 100) * 0.35,
      backgroundImage: 'linear-gradient(135deg, rgba(255,0,128,0.2) 0%, rgba(0,255,255,0.2) 50%, rgba(255,255,0,0.2) 100%)',
    }),
  },
  vignette: {
    id: 'vignette',
    label: 'Vignette Dark',
    description: 'Smooth dark obsidian vignette edges',
    blendMode: 'multiply',
    getOverlayStyle: (intensity: number) => ({
      opacity: (intensity / 100) * 0.7,
      backgroundImage: 'radial-gradient(circle at center, transparent 35%, rgba(0, 0, 0, 0.85) 100%)',
    }),
  },
};

/**
 * Calculates current mood tone based on local time
 */
export function getMoodToneForTime(hour = new Date().getHours()): { tone: FilterTone; description: string } {
  if (hour >= 5 && hour < 12) {
    return { tone: 'vivid', description: 'Vibrant Morning: energetic saturation' };
  } else if (hour >= 12 && hour < 17) {
    return { tone: 'original', description: 'Afternoon Sun: natural clarity' };
  } else if (hour >= 17 && hour < 20) {
    return { tone: 'warm', description: 'Golden Sunset: warm amber glow' };
  } else {
    return { tone: 'mono', description: 'Calming Night: soothing monochrome' };
  }
}
