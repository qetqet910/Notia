import React from 'react';
import { motion } from 'framer-motion';

export const BackgroundOrbs = React.memo(() => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-slate-50 dark:bg-slate-950">
      {/* Base Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-cyan-50/50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900" />

      {/* 
         Orb 1: Purple (Top Right) 
         움직임을 더 크게, 시간을 길게 잡아서 부드럽게 흐르도록 설정
      */}
      <motion.div
        className="absolute -top-[20%] -right-[10%] w-[80vw] h-[80vw] rounded-full bg-purple-300/40 dark:bg-purple-800/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen"
        animate={{
          x: [0, -100, 50, 0],
          y: [0, 50, -100, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
      />

      {/* Orb 2: Mint/Teal (Bottom Left) */}
      <motion.div
        className="absolute -bottom-[20%] -left-[10%] w-[80vw] h-[80vw] rounded-full bg-[#61C9A8]/40 dark:bg-[#61C9A8]/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen"
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -100, 50, 0],
          scale: [1, 1.2, 0.95, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
      />

      {/* Orb 3: White/Ice Blue Accent (Center-ish) - 하이라이트 역할 */}
      <motion.div
        className="absolute top-[20%] left-[20%] w-[70vw] h-[70vw] rounded-full bg-white/60 dark:bg-slate-200/10 blur-[130px] mix-blend-overlay dark:mix-blend-screen"
        animate={{
          x: [0, -70, 70, 0],
          y: [0, 70, -70, 0],
          scale: [1, 1.2, 0.8, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
      />
    </div>
  );
});

BackgroundOrbs.displayName = 'BackgroundOrbs';
