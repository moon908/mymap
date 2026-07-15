'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  isVisible: boolean;
  message?: string;
}

export default function LoadingScreen({ isVisible, message = 'Loading System Resources' }: LoadingScreenProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0c0a09] text-[#f2f2f7]"
        >
          {/* Glowing Background Radial */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,122,255,0.08)_0%,transparent_60%)] pointer-events-none" />

          <div className="relative flex flex-col items-center space-y-6 max-w-xs text-center">
            {/* Spinning/pulsing logo container */}
            <div className="relative flex items-center justify-center w-24 h-24">
              {/* Outer glow ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                className="absolute inset-0 rounded-full border-t-2 border-r-2 border-primary/40 border-l-2 border-b-2 border-transparent"
              />
              {/* Inner accent ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
                className="absolute w-16 h-16 rounded-full border-b-2 border-l-2 border-secondary/60 border-t-2 border-r-2 border-transparent"
              />
              {/* Central glowing core */}
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                className="w-8 h-8 rounded-full bg-primary shadow-[0_0_20px_#007AFF] flex items-center justify-center"
              >
                <div className="w-3 h-3 rounded-full bg-white" />
              </motion.div>
            </div>

            {/* Loading text messages */}
            <div className="space-y-2">
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg font-semibold tracking-wide font-sans text-white"
              >
                GEOSPATIAL PLATFORM
              </motion.h2>
              <motion.p
                key={message}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
                className="text-xs font-mono tracking-wider uppercase text-neutral-400"
              >
                {message}...
              </motion.p>
            </div>

            {/* Fine print */}
            <div className="text-[10px] text-neutral-500 font-mono absolute bottom-[-80px] w-56">
              SECURE CONNECT // TOMTOM v6 SDK
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
