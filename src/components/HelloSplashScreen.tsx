import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface HelloSplashScreenProps {
  onComplete: () => void;
}

export const HelloSplashScreen: React.FC<HelloSplashScreenProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<'writing' | 'visible' | 'exit'>('writing');

  useEffect(() => {
    // Stage 1: Writing and pen cursor finish around 1.35s
    const visibleTimer = setTimeout(() => {
      setStage('visible');
    }, 1350);

    // Stage 2: Smooth transition to main dashboard at 1.7s
    const exitTimer = setTimeout(() => {
      setStage('exit');
    }, 1700);

    // Stage 3: Fully unmount at 1.95s
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 1950);

    return () => {
      clearTimeout(visibleTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        key="hello-startup-screen"
        initial={{ opacity: 1 }}
        animate={{ opacity: stage === 'exit' ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        onClick={onComplete}
        className="fixed inset-0 z-[9999] bg-[#000000] flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden gpu-60fps"
      >
        {/* Subtle gentle upward motion container */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex flex-col items-center justify-center gpu-60fps"
        >
          {/* Authentic Glass Widgets Logo Asset */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="mb-5 w-20 h-20 rounded-2xl overflow-hidden border border-white/25 shadow-[0_10px_35px_rgba(0,0,0,0.9)] bg-black flex items-center justify-center"
          >
            <img
              src="/logo.png"
              alt="Glass Widgets Logo"
              className="w-full h-full object-contain"
            />
          </motion.div>

          {/* Handwritten "Hello" Typography - Rendered with live pen writing */}
          <svg
            viewBox="0 0 460 170"
            className="w-64 sm:w-80 md:w-96 h-auto overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id="cursorGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 1. Letter 'H' - Left Stem */}
            <motion.path
              d="M 50,32 C 52,50 48,95 46,128 C 45,134 47,137 52,135"
              fill="none"
              stroke="#ffffff"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.28, delay: 0.05, ease: 'easeInOut' }}
            />

            {/* 2. Letter 'H' - Crossbar & Right Stem into loop */}
            <motion.path
              d="M 47,82 C 60,78 80,76 96,75 M 95,28 C 98,48 94,95 92,126 C 92,132 96,134 102,130 C 112,124 125,98 132,86"
              fill="none"
              stroke="#ffffff"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.28, ease: 'easeInOut' }}
            />

            {/* 3. Letter 'e' - Smooth loop */}
            <motion.path
              d="M 132,86 C 142,70 156,68 162,76 C 168,85 156,104 142,114 C 132,122 125,120 128,112 C 132,102 144,88 158,84 C 172,80 182,90 186,104 C 190,120 198,124 208,122"
              fill="none"
              stroke="#ffffff"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.28, delay: 0.58, ease: 'easeInOut' }}
            />

            {/* 4. Letter 'l' (First) - Ascending loop */}
            <motion.path
              d="M 208,122 C 220,118 230,86 235,52 C 238,28 244,22 249,24 C 254,26 252,40 248,64 L 238,120 C 236,128 242,131 250,127"
              fill="none"
              stroke="#ffffff"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.28, delay: 0.82, ease: 'easeInOut' }}
            />

            {/* 5. Letter 'l' (Second) - Ascending loop */}
            <motion.path
              d="M 250,127 C 262,121 272,86 277,52 C 280,28 286,22 291,24 C 296,26 294,40 290,64 L 280,120 C 278,128 284,131 292,127"
              fill="none"
              stroke="#ffffff"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.28, delay: 1.02, ease: 'easeInOut' }}
            />

            {/* 6. Letter 'o' - Smooth closed oval and flick */}
            <motion.path
              d="M 292,127 C 304,121 316,104 326,92 C 338,78 352,76 359,84 C 366,94 358,112 346,122 C 334,132 320,130 318,118 C 316,106 328,90 342,86 C 356,82 366,90 370,102 C 374,114 384,118 396,116"
              fill="none"
              stroke="#ffffff"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.28, delay: 1.22, ease: 'easeInOut' }}
            />

            {/* Dynamic Moving Writing Pen Tip / Cursor - Synchronized with letter progress */}
            {stage === 'writing' && (
              <motion.g
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 1, 1, 1, 1, 1, 1, 0],
                  x: [50, 46, 95, 92, 132, 186, 249, 238, 291, 280, 359, 396],
                  y: [32, 128, 28, 126, 86, 104, 24, 120, 24, 120, 84, 116],
                }}
                transition={{
                  duration: 1.35,
                  times: [0, 0.08, 0.24, 0.42, 0.58, 0.72, 0.84, 0.94, 0.98, 1],
                  ease: 'easeInOut',
                }}
              >
                <circle cx="0" cy="0" r="3.5" fill="#ffffff" filter="url(#cursorGlow)" />
                <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
              </motion.g>
            )}
          </svg>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
