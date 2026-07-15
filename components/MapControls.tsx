'use client';

import React from 'react';
import { 
  Navigation, 
  Plus, 
  Minus, 
  Compass, 
  Maximize, 
  Minimize, 
  Loader2 
} from 'lucide-react';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetNorth: () => void;
  onLocateUser: () => void;
  onToggleFullscreen: () => void;
  onToggle3D: () => void;
  is3D: boolean;
  isFullscreen: boolean;
  isLocating: boolean;
}

export default function MapControls({
  onZoomIn,
  onZoomOut,
  onResetNorth,
  onLocateUser,
  onToggleFullscreen,
  onToggle3D,
  is3D,
  isFullscreen,
  isLocating,
}: MapControlsProps) {


  return (
    <div className="absolute right-4 bottom-24 z-10 flex flex-col space-y-3">
      {/* Zoom and Navigation Capsule */}
      <div className="glass-panel flex flex-col items-center rounded-card-sm shadow-md divide-y divide-neutral-200/50 dark:divide-neutral-800/50">
        {/* Locate user button */}
        <button
          onClick={onLocateUser}
          className="relative group p-3 rounded-t-card-sm text-neutral-600 dark:text-neutral-300 hover:text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Locate Current Position"
        >
          {isLocating ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          ) : (
            <Navigation className="w-5 h-5" />
          )}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap bg-neutral-900/90 dark:bg-neutral-850/90 text-white text-[10px] px-2.5 py-1 rounded shadow-md z-30 scale-95 group-hover:scale-100 transform origin-top border border-neutral-700/30">
            Locate Position
          </div>
        </button>

        {/* Zoom In button */}
        <button
          onClick={onZoomIn}
          className="relative group p-3 text-neutral-600 dark:text-neutral-300 hover:text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Zoom In"
        >
          <Plus className="w-5 h-5" />
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap bg-neutral-900/90 dark:bg-neutral-850/90 text-white text-[10px] px-2.5 py-1 rounded shadow-md z-30 scale-95 group-hover:scale-100 transform origin-top border border-neutral-700/30">
            Zoom In
          </div>
        </button>

        {/* Zoom Out button */}
        <button
          onClick={onZoomOut}
          className="relative group p-3 text-neutral-600 dark:text-neutral-300 hover:text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Zoom Out"
        >
          <Minus className="w-5 h-5" />
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap bg-neutral-900/90 dark:bg-neutral-850/90 text-white text-[10px] px-2.5 py-1 rounded shadow-md z-30 scale-95 group-hover:scale-100 transform origin-top border border-neutral-700/30">
            Zoom Out
          </div>
        </button>

        {/* Reset compass angle */}
        <button
          onClick={onResetNorth}
          className="relative group p-3 text-neutral-600 dark:text-neutral-300 hover:text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Reset Compass (North)"
        >
          <Compass className="w-5 h-5" />
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap bg-neutral-900/90 dark:bg-neutral-850/90 text-white text-[10px] px-2.5 py-1 rounded shadow-md z-30 scale-95 group-hover:scale-100 transform origin-top border border-neutral-700/30">
            Reset Compass
          </div>
        </button>

        {/* 3D Map Toggle Button */}
        <button
          onClick={onToggle3D}
          className={`relative group p-3 rounded-b-card-sm transition-colors ${
            is3D 
              ? 'text-primary bg-primary/10 hover:bg-primary/20' 
              : 'text-neutral-600 dark:text-neutral-300 hover:text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
          title="Toggle 3D View"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {/* Ground plane grid */}
            <path d="M3 16L12 21L21 16L12 11L3 16Z" />
            {/* Tall 3D Building block */}
            <path d="M8 13.5V7.5L12 5.5V11.5" />
            <path d="M12 5.5L16 7.5V13.5" />
            {/* A smaller building next to it */}
            <path d="M16 13.5V10.5L19 9V12" />
          </svg>
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap bg-neutral-900/90 dark:bg-neutral-850/90 text-white text-[10px] px-2.5 py-1 rounded shadow-md z-30 scale-95 group-hover:scale-100 transform origin-top border border-neutral-700/30">
            Toggle 3D View
          </div>
        </button>
      </div>

      {/* Screen controls capsule */}
      <div className="glass-panel flex flex-col items-center rounded-card-sm shadow-md">
        {/* Fullscreen toggle */}
        <button
          onClick={onToggleFullscreen}
          className="relative group p-3 rounded-card-sm text-neutral-600 dark:text-neutral-300 hover:text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap bg-neutral-900/90 dark:bg-neutral-850/90 text-white text-[10px] px-2.5 py-1 rounded shadow-md z-30 scale-95 group-hover:scale-100 transform origin-top border border-neutral-700/30">
            Toggle Fullscreen
          </div>
        </button>
      </div>
    </div>
  );
}
