'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, WifiOff, MapPinOff, XCircle, X } from 'lucide-react';

export type ErrorType = 'network' | 'location' | 'api-limit' | 'not-found' | 'general' | null;

interface ErrorOverlayProps {
  errorType: ErrorType;
  message: string;
  onClose: () => void;
}

export default function ErrorOverlay({ errorType, message, onClose }: ErrorOverlayProps) {
  const getIcon = () => {
    switch (errorType) {
      case 'network':
        return <WifiOff className="w-5 h-5 text-tertiary" />;
      case 'location':
        return <MapPinOff className="w-5 h-5 text-tertiary" />;
      case 'api-limit':
        return <AlertTriangle className="w-5 h-5 text-[#ff3b30]" />;
      case 'not-found':
        return <XCircle className="w-5 h-5 text-neutral-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-[#ff3b30]" />;
    }
  };

  const getTitle = () => {
    switch (errorType) {
      case 'network':
        return 'Connection Interrupted';
      case 'location':
        return 'Location Service Denied';
      case 'api-limit':
        return 'API Limit Exceeded';
      case 'not-found':
        return 'Address Not Found';
      default:
        return 'Application Error';
    }
  };

  return (
    <AnimatePresence>
      {errorType && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] w-[90%] max-w-sm">
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="glass-panel relative flex items-start p-4 space-x-3.5 rounded-card-md shadow-lg overflow-hidden"
          >
            {/* Warning indicator line */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary" />

            <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
            
            <div className="flex-grow min-w-0 pr-4">
              <h3 className="text-sm font-semibold text-foreground tracking-tight font-sans">
                {getTitle()}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-sans mt-0.5 leading-relaxed">
                {message}
              </p>
            </div>

            <button
              onClick={onClose}
              className="flex-shrink-0 text-neutral-400 hover:text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 p-1 rounded-full transition-colors"
              aria-label="Close error message"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
